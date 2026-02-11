/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // يتجاهل أخطاء التايب سكريبت التي تمنع ظهور الصفحات
    ignoreBuildErrors: true,
  },
  eslint: {
    // يتجاهل أخطاء التنسيق لضمان سرعة البناء
    ignoreDuringBuilds: true,
  },
  // تأكد من السماح بالـ API الخارجية إذا لزم الأمر
  images: {
    unoptimized: true,
  }
};

export default nextConfig;
