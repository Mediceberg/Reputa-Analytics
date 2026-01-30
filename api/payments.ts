/**
 * Consolidated Payments API
 * Handles all payment-related operations: approve, complete, payout, send-pi
 * Full A2U (App-to-User) payment flow with blockchain transaction
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'; 
import { Redis } from '@upstash/redis';
import * as StellarSdk from 'stellar-sdk';

const redis = new Redis({
  url: process.env.KV_REST_API_URL || '',
  token: process.env.KV_REST_API_TOKEN || '',
});

const PI_NETWORK = process.env.PI_NETWORK || 'testnet';
const PI_API_KEY = PI_NETWORK === 'mainnet' 
  ? process.env.PI_API_KEY_MAINNET 
  : process.env.PI_API_KEY;
const PI_API_BASE = 'https://api.minepi.com/v2';
const APP_WALLET_SEED = process.env.APP_WALLET_SEED;

const PI_HORIZON_URL = PI_NETWORK === 'mainnet'
  ? 'https://api.mainnet.minepi.com'
  : 'https://api.testnet.minepi.com';

const piServer = new StellarSdk.Horizon.Server(PI_HORIZON_URL, { allowHttp: false });

async function submitA2UTransaction(
  toAddress: string, 
  amount: number, 
  memo: string,
  paymentId: string
): Promise<{ txid: string } | { error: string }> {
  if (!APP_WALLET_SEED) {
    return { error: 'APP_WALLET_SEED not configured' };
  }

  try {
    const sourceKeypair = StellarSdk.Keypair.fromSecret(APP_WALLET_SEED);
    const sourcePublicKey = sourceKeypair.publicKey();
    
    const account = await piServer.loadAccount(sourcePublicKey);
    
    const transaction = new StellarSdk.TransactionBuilder(account, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: PI_NETWORK === 'mainnet' 
        ? 'Pi Network' 
        : 'Pi Testnet',
    })
      .addOperation(StellarSdk.Operation.payment({
        destination: toAddress,
        asset: StellarSdk.Asset.native(),
        amount: amount.toFixed(7),
      }))
      .addMemo(StellarSdk.Memo.text(memo.substring(0, 28)))
      .setTimeout(180)
      .build();

    transaction.sign(sourceKeypair);

    const result = await piServer.submitTransaction(transaction);
    console.log(`[A2U] Transaction submitted: ${result.hash}`);
    
    return { txid: result.hash };
  } catch (error: any) {
    console.error('[A2U] Transaction failed:', error);
    const errorMessage = error.response?.data?.extras?.result_codes?.operations?.[0] 
      || error.message 
      || 'Transaction failed';
    return { error: errorMessage };
  }
}

async function completeA2UPayment(paymentId: string, txid: string): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const response = await fetch(`${PI_API_BASE}/payments/${paymentId}/complete`, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${PI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ txid })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error(`[A2U] Complete failed:`, data);
      return { success: false, error: data.message || 'Complete failed' };
    }
    
    console.log(`[A2U] Payment ${paymentId} completed`);
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

function setCorsHeaders(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
}

async function handleApprove(paymentId: string, res: VercelResponse) {
  if (!paymentId) {
    return res.status(400).json({ error: 'Missing paymentId' });
  }

  try {
    const piResponse = await fetch(`${PI_API_BASE}/payments/${paymentId}/approve`, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${PI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await piResponse.json();
    
    if (!piResponse.ok) {
      console.error(`[APPROVE ERROR] Payment ${paymentId}:`, data);
      return res.status(piResponse.status).json({ 
        error: 'Approval failed',
        details: data
      });
    }
    
    console.log(`[APPROVE SUCCESS] Payment ${paymentId} approved on ${PI_NETWORK}`);
    
    return res.status(200).json({
      approved: true,
      network: PI_NETWORK,
      ...data
    });
  } catch (error: any) {
    console.error('[APPROVE ERROR]', error.message);
    return res.status(500).json({ 
      error: 'Approval failed',
      details: error.message 
    });
  }
}

async function handleComplete(body: any, res: VercelResponse) {
  const { paymentId, txid, uid, userId, amount } = body;
  
  const userIdentifier = uid || userId;

  if (!paymentId || !txid) {
    return res.status(400).json({ 
      error: 'Payment completion failed: Missing required fields',
      completed: false,
      success: false
    });
  }

  console.log(`[COMPLETE] Payment ${paymentId}, TXID: ${txid}, User: ${userIdentifier}`);

  try {
    const piResponse = await fetch(`${PI_API_BASE}/payments/${paymentId}/complete`, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${PI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ txid })
    });

    const piData = await piResponse.json();
    
    if (!piResponse.ok) {
      console.error(`[COMPLETE] Pi API error:`, piData);
      return res.status(piResponse.status).json({
        error: piData.message || 'Payment completion failed on Pi server',
        completed: false,
        success: false,
        details: piData
      });
    }

    console.log(`[COMPLETE] Pi API success:`, piData);

    if (userIdentifier) {
      await redis.set(`vip:${userIdentifier}`, JSON.stringify({
        paymentId,
        txid,
        activatedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
      }), { ex: 365 * 24 * 60 * 60 });

      await redis.incr(`payment_count:${userIdentifier}`);
    }

    const subscriptionData = {
      userId: userIdentifier,
      paymentId,
      txid,
      amount,
      type: 'vip_subscription',
      status: 'completed',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      reputationBonus: 50
    };

    console.log('[SUBSCRIPTION UPDATED]', subscriptionData);

    return res.status(200).json({
      completed: true,
      success: true,
      subscription: subscriptionData,
      message: 'VIP subscription activated successfully'
    });
  } catch (error: any) {
    console.error('[COMPLETE] Error:', error);
    return res.status(500).json({
      error: error.message || 'Payment completion failed',
      completed: false,
      success: false
    });
  }
}

async function handlePayout(body: any, res: VercelResponse) {
  const { address, amount, uid, memo, eventId } = body;

  if (!PI_API_KEY) {
    return res.status(500).json({ error: "PI_API_KEY not configured for A2U payments" });
  }

  if (!APP_WALLET_SEED) {
    return res.status(500).json({ error: "APP_WALLET_SEED not configured for A2U payments" });
  }

  if (!uid) {
    return res.status(400).json({ error: "Missing UID - user must be authenticated" });
  }
  
  if (!address || address.length < 20 || !address.startsWith('G')) {
    return res.status(400).json({ error: "Invalid wallet address format" });
  }

  const payoutAmount = parseFloat(amount) || 0.01;
  if (payoutAmount <= 0 || payoutAmount > 100) {
    return res.status(400).json({ error: "Invalid payout amount (must be 0.01-100 Pi)" });
  }

  try {
    console.log(`[A2U] Step 0: Checking for incomplete server payments for UID ${uid}...`);
    const incompleteRes = await fetch(`${PI_API_BASE}/payments/incomplete_server_payments`, {
      headers: { 'Authorization': `Key ${PI_API_KEY}` }
    });
    
    if (incompleteRes.ok) {
      const incompleteData = await incompleteRes.json();
      const userIncomplete = incompleteData.incomplete_server_payments?.filter(
        (p: any) => p.user_uid === uid
      ) || [];
      
      if (userIncomplete.length > 0) {
        console.log(`[A2U] Found ${userIncomplete.length} incomplete payments for user. Cancelling...`);
        for (const payment of userIncomplete) {
          try {
            await fetch(`${PI_API_BASE}/payments/${payment.identifier}/cancel`, {
              method: 'POST',
              headers: { 
                'Authorization': `Key ${PI_API_KEY}`, 
                'Content-Type': 'application/json' 
              }
            });
            console.log(`[A2U] Cancelled incomplete payment ${payment.identifier}`);
          } catch (cancelErr) {
            console.warn(`[A2U] Failed to cancel ${payment.identifier}:`, cancelErr);
          }
        }
        await new Promise(r => setTimeout(r, 1000));
      }
    }
  } catch (checkErr) {
    console.warn('[A2U] Could not check incomplete payments:', checkErr);
  }

  const amountCents = Math.round(payoutAmount * 100);
  const payoutEvent = eventId || 'reputa_reward';
  const idempotencyKey = `payout:${uid}:${amountCents}:${payoutEvent}`;
  
  const existingIdempotent = await redis.get(`idempotent:${idempotencyKey}`);
  if (existingIdempotent) {
    const existingData = JSON.parse(existingIdempotent as string);
    console.log(`[A2U] Duplicate request blocked for ${idempotencyKey}`);
    return res.status(200).json({ 
      success: true, 
      paymentId: existingData.paymentId,
      txid: existingData.txid,
      network: existingData.network,
      duplicate: true,
      message: "This payout was already processed"
    });
  }
  
  await redis.del(`payout_pending:${uid}`);

  const paymentMemo = (memo || "Reputa Reward").substring(0, 28);
  let paymentId: string | null = null;
  let txid: string | null = null;

  try {
    console.log(`[A2U] Step 1: Creating payment for ${payoutAmount} Pi to UID ${uid} on ${PI_NETWORK}`);
    
    const createResponse = await fetch(`${PI_API_BASE}/payments`, {
      method: 'POST',
      headers: { 
        'Authorization': `Key ${PI_API_KEY}`, 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({
        payment: {
          amount: payoutAmount,
          memo: paymentMemo,
          metadata: { 
            type: "app_to_user_payout",
            network: PI_NETWORK,
            idempotencyKey,
            eventId: eventId || 'reputa_reward',
            timestamp: new Date().toISOString()
          },
          uid: uid
        }
      }),
    });

    const createData = await createResponse.json();
    
    if (!createResponse.ok) {
      console.error(`[A2U] Step 1 FAILED:`, createData);
      const errorMessage = createData?.error_message || createData?.message || 'Payment creation failed';
      return res.status(createResponse.status).json({ 
        error: errorMessage,
        step: 'create',
        details: createData,
        network: PI_NETWORK
      });
    }

    paymentId = createData.identifier;
    const recipientAddress = createData.to_address || address;
    
    console.log(`[A2U] Step 1 SUCCESS: Payment ${paymentId} created, recipient: ${recipientAddress}`);
    
    await redis.set(`payout_pending:${uid}`, paymentId, { ex: 7200 });
    await redis.set(`payout_history:${paymentId}`, JSON.stringify({
      uid, address: recipientAddress, amount: payoutAmount, status: 'created',
      network: PI_NETWORK, idempotencyKey, createdAt: new Date().toISOString()
    }), { ex: 86400 * 30 });

    console.log(`[A2U] Step 2: Approving payment...`);
    
    const approveResponse = await fetch(`${PI_API_BASE}/payments/${paymentId}/approve`, {
      method: 'POST',
      headers: { 
        'Authorization': `Key ${PI_API_KEY}`, 
        'Content-Type': 'application/json' 
      }
    });

    const approveData = await approveResponse.json();
    
    if (!approveResponse.ok) {
      console.error(`[A2U] Step 2 FAILED:`, approveData);
      await redis.set(`payout_history:${paymentId}`, JSON.stringify({
        uid, address: recipientAddress, amount: payoutAmount, status: 'approve_failed',
        network: PI_NETWORK, error: approveData.message || 'Approval failed', createdAt: new Date().toISOString()
      }), { ex: 86400 * 30 });
      
      let errorMessage = approveData.message || 'Payment approval failed';
      if (approveData.error === 'insufficient_balance' || errorMessage.includes('balance')) {
        errorMessage = 'App wallet has insufficient balance. Please fund the app wallet in Pi Developer Portal.';
      } else if (approveData.error === 'user_not_found' || errorMessage.includes('user')) {
        errorMessage = 'User not found. Please ensure you are logged in with a valid Pi account.';
      } else if (errorMessage.includes('ongoing') || errorMessage.includes('incomplete')) {
        errorMessage = 'There is an ongoing payment. Please wait a moment and try again.';
      }
      
      return res.status(approveResponse.status).json({ 
        error: errorMessage,
        step: 'approve',
        paymentId,
        network: PI_NETWORK,
        rawError: approveData
      });
    }
    
    console.log(`[A2U] Step 2 SUCCESS: Payment ${paymentId} approved`);

    console.log(`[A2U] Step 3: Submitting blockchain transaction...`);
    
    const txResult = await submitA2UTransaction(
      recipientAddress,
      payoutAmount,
      paymentMemo,
      paymentId as string
    );
    
    if ('error' in txResult) {
      console.error(`[A2U] Step 3 FAILED:`, txResult.error);
      await redis.set(`payout_history:${paymentId}`, JSON.stringify({
        uid, address: recipientAddress, amount: payoutAmount, status: 'tx_failed',
        network: PI_NETWORK, error: txResult.error, createdAt: new Date().toISOString()
      }), { ex: 86400 * 30 });
      
      return res.status(500).json({ 
        error: `Blockchain transaction failed: ${txResult.error}`,
        step: 'submit',
        paymentId,
        network: PI_NETWORK
      });
    }
    
    txid = txResult.txid;
    console.log(`[A2U] Step 3 SUCCESS: Transaction ${txid} submitted`);

    console.log(`[A2U] Step 4: Completing payment on Pi server...`);
    
    const completeResult = await completeA2UPayment(paymentId as string, txid);
    
    if (!completeResult.success) {
      console.error(`[A2U] Step 4 FAILED:`, completeResult.error);
      await redis.set(`payout_history:${paymentId}`, JSON.stringify({
        uid, address: recipientAddress, amount: payoutAmount, status: 'complete_failed',
        network: PI_NETWORK, txid, error: completeResult.error, createdAt: new Date().toISOString()
      }), { ex: 86400 * 30 });
      
      return res.status(200).json({ 
        success: true,
        warning: 'Transaction sent but completion pending',
        paymentId,
        txid,
        network: PI_NETWORK
      });
    }
    
    console.log(`[A2U] Step 4 SUCCESS: Payment completed!`);
    
    await redis.del(`payout_pending:${uid}`);
    
    await redis.set(`idempotent:${idempotencyKey}`, JSON.stringify({
      paymentId, txid, network: PI_NETWORK, amount: payoutAmount,
      completedAt: new Date().toISOString()
    }), { ex: 86400 * 7 });
    
    await redis.set(`payout_history:${paymentId}`, JSON.stringify({
      uid, address: recipientAddress, amount: payoutAmount, status: 'completed',
      network: PI_NETWORK, txid, idempotencyKey, completedAt: new Date().toISOString()
    }), { ex: 86400 * 30 });
    
    return res.status(200).json({ 
      success: true, 
      paymentId,
      txid,
      network: PI_NETWORK,
      message: `Successfully sent ${payoutAmount} Pi`
    });
    
  } catch (error: any) {
    console.error('[A2U] Unexpected error:', error.message);
    
    if (paymentId) {
      await redis.set(`payout_history:${paymentId}`, JSON.stringify({
        uid, address, amount: payoutAmount, status: 'error',
        network: PI_NETWORK, txid, error: error.message, createdAt: new Date().toISOString()
      }), { ex: 86400 * 30 });
    }
    
    return res.status(500).json({ 
      error: "Payment processing error - please try again",
      details: error.message,
      paymentId,
      txid
    });
  }
}

async function handleSendPi(body: any, res: VercelResponse) {
  const { amount, cleanAddress, recipientUid, responseData, responseOk } = body;

  if (!responseOk) {
    return res.status(400).json({ success: false, message: "Response not okay" });
  }

  try {
    const now = new Date();
    const txTimestamp = now.toISOString();
    
    const isDexSwap = parseFloat(amount) === 3.14; 
    const txType = isDexSwap ? "Pi DEX Swap" : "Sent";
    const subType = isDexSwap ? "Ecosystem Exchange" : "Wallet Transfer";

    const transactionDetail = JSON.stringify({
      id: responseData?.identifier ? (responseData.identifier as string).substring(0, 8) : Math.random().toString(36).substring(2, 10),
      type: txType,
      subType: subType,
      amount: parseFloat(amount).toFixed(2),
      status: "Success",
      exactTime: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
      dateLabel: "Today", 
      timestamp: txTimestamp,
      to: cleanAddress
    });

    await redis.lpush(`history:${cleanAddress}`, transactionDetail);
    await redis.ltrim(`history:${cleanAddress}`, 0, 9);
    await redis.incr(`tx_count:${cleanAddress}`);
    if (recipientUid) {
      await redis.incr(`tx_count:${recipientUid}`);
    }
    await redis.incr('total_app_transactions');
    
    return res.status(200).json({ success: true, data: responseData });
  } catch (error) {
    console.error("Error processing transaction:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}

async function handlePiAction(paymentId: string, action: string, txid?: string, res?: VercelResponse) {
  const url = `${PI_API_BASE}/payments/${paymentId}/${action}`;
  const resPi = await fetch(url, {
    method: 'POST',
    headers: { 
      'Authorization': `Key ${PI_API_KEY}`, 
      'Content-Type': 'application/json' 
    },
    body: action === 'complete' ? JSON.stringify({ txid }) : undefined,
  });
  const dataPi = await resPi.json();
  return res?.status(resPi.status).json(dataPi);
}

async function handleClearPending(body: any, res: VercelResponse) {
  const { uid } = body;
  
  if (!uid) {
    return res.status(400).json({ error: "Missing UID" });
  }
  
  try {
    await redis.del(`payout_pending:${uid}`);
    console.log(`[PAYOUT] Cleared pending payout for ${uid}`);
    return res.status(200).json({ success: true, message: "Pending payout cleared" });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

async function handleIncompletePayments(res: VercelResponse) {
  try {
    const response = await fetch(`${PI_API_BASE}/payments/incomplete_server_payments`, {
      headers: { 'Authorization': `Key ${PI_API_KEY}` }
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch incomplete payments', details: data });
    }
    
    return res.status(200).json({
      incomplete: data.incomplete_server_payments || [],
      network: PI_NETWORK,
      count: data.incomplete_server_payments?.length || 0
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

async function handleCheckPayoutStatus(body: any, res: VercelResponse) {
  const { uid, paymentId } = body;
  
  if (!uid && !paymentId) {
    return res.status(400).json({ error: "Missing UID or paymentId" });
  }
  
  try {
    if (paymentId) {
      const history = await redis.get(`payout_history:${paymentId}`);
      const piResponse = await fetch(`${PI_API_BASE}/payments/${paymentId}`, {
        headers: { 'Authorization': `Key ${PI_API_KEY}` }
      });
      const piData = await piResponse.json();
      
      return res.status(200).json({
        paymentId,
        history: history ? JSON.parse(history as string) : null,
        piStatus: piData,
        network: PI_NETWORK
      });
    }
    
    const pendingId = await redis.get(`payout_pending:${uid}`);
    return res.status(200).json({
      uid,
      hasPending: !!pendingId,
      pendingPaymentId: pendingId,
      network: PI_NETWORK
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { action, paymentId, txid } = body;

    switch (action) {
      case 'approve':
        return handleApprove(paymentId, res);
      
      case 'complete':
        return handleComplete(body, res);
      
      case 'cancel':
        if (!paymentId) return res.status(400).json({ error: 'Missing paymentId' });
        try {
          const cancelRes = await fetch(`${PI_API_BASE}/payments/${paymentId}/cancel`, {
            method: 'POST',
            headers: { 
              'Authorization': `Key ${PI_API_KEY}`, 
              'Content-Type': 'application/json' 
            }
          });
          const cancelData = await cancelRes.json();
          console.log(`[A2U] Cancelled payment ${paymentId}:`, cancelData);
          return res.status(cancelRes.status).json(cancelData);
        } catch (err: any) {
          return res.status(500).json({ error: err.message });
        }
      
      case 'payout':
        return handlePayout(body, res);
      
      case 'send':
        return handleSendPi(body, res);
      
    case 'clear_pending':
      try {
        const { uid } = body;
        if (!uid) return res.status(400).json({ error: "Missing UID" });

        await redis.del(`payout_pending:${uid}`);
        
        // Also fetch from Pi API to see if there are actual incomplete server payments
        const incompleteRes = await fetch(`${PI_API_BASE}/payments/incomplete_server_payments`, {
          headers: { 'Authorization': `Key ${PI_API_KEY}` }
        });
        const incompleteData = await incompleteRes.json();
        
        if (incompleteRes.ok && incompleteData.incomplete_server_payments) {
          for (const payment of incompleteData.incomplete_server_payments) {
            if (payment.uid === uid) {
              console.log(`[PAYOUT] Found incomplete Pi server payment ${payment.identifier} for user ${uid}`);
            }
          }
        }

        console.log(`[PAYOUT] Cleared local pending lock for ${uid}`);
        return res.status(200).json({ success: true, message: "Pending status cleared" });
      } catch (error: any) {
        return res.status(500).json({ error: error.message });
      }
      
      case 'check_status':
        return handleCheckPayoutStatus(body, res);
      
      case 'incomplete_payments':
        return handleIncompletePayments(res);
      
      default:
        if (paymentId && action) {
          return handlePiAction(paymentId, action, txid, res);
        }
        return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error: any) {
    console.error('[PAYMENTS ERROR]', error);
    return res.status(500).json({ error: error.message });
  }
}
