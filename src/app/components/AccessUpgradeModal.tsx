  const handlePayment = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!currentUser) return;

    // ---- Demo Mode ----
    if (currentUser.uid === "demo") {
      onUpgrade();
      onClose();
      alert("✅ VIP Unlocked (Demo)!");
      return;
    }

    try {
      // نعتمد كلياً على الوظيفة الموجودة في piPayments.ts
      // مررنا onSuccess لكي يتم تحديث الواجهة فور اكتمال الدفع بنجاح
      await createVIPPayment(currentUser.uid, () => {
        onUpgrade();
        onClose();
        alert("✅ VIP Access Granted Successfully!");
      });

    } catch (err: any) {
      console.error("Modal Payment Error:", err);
      // لم نعد بحاجة لـ alert هنا لأن createVIPPayment تحتوي على alert داخلي للتفاصيل
    }
  };
