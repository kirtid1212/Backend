const admin = require("firebase-admin");
require("dotenv").config();

/* =========================================================
   SAFETY CHECK (OPTIONAL BUT RECOMMENDED)
   ========================================================= */
if (
  !process.env.FIREBASE_PROJECT_ID ||
  !process.env.FIREBASE_PRIVATE_KEY ||
  !process.env.FIREBASE_CLIENT_EMAIL
) {
  throw new Error("❌ Missing Firebase environment variables");
}

/* =========================================================
   FIREBASE SERVICE ACCOUNT (DUMMY VALUES EXAMPLE)
   ========================================================= */
const serviceAccount = {
  type: "service_account",

  // ✅ EXACT Firebase Project ID
  project_id: "ecommerce-50fcd",

  // 🔐 From serviceAccountKey.json
  private_key_id: "683c20a7fa42c29ea581a2c95142c4893bad0eb6",

  // 🔐 MUST stay in one line with \n
  private_key:
   "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCq7a57TYVDR7Pe\n0pXmF70ggNAhtTUkWXQ6UQAxnGp53FsJL1KxsyDY9lXvCCyEaSGMZSMpXhkkGFVQ\n2jZr6RjQRYT1KQES3geTj2bH1hKoLkEbZ2xt3Vo7vjOvTEk0Tp9j7e5Gz13uhDfm\nsnHHPJ8GKiBkr2lG/+PihHNDKDsq7/muwBp0IIFDuWZN2QQiib2WpeONkJQYNdxI\n1s9uCl3qCTtVh8vOUJm6ixqigXv+dqvxXHk51Ab6yumlzF2eFPWYIRWyheMFIm8c\n/0YoTygelJir7E4mZoKgQe4PctDj4SrEl5ilk1iz2hWebyuGqEdjehMO2VYkrudq\n4Uc3HY3pAgMBAAECggEABG64dRscBxQfbnpQh9B6x5J/kzgzQheNw4thMWgofLOB\nqtnOz6vhAK9WqCWyndZqF81xnXuCtGRrJfcarS60xYXf/kmLbRVT5fg0hp8fCbx1\nVMQYVDsGwYDbr0KPrWsSiBFd+fkbqvlDx9g9yhhg2VSTVXkVBlHRc4jSwl2TNzhK\nAELeJnD8Gs6c6ibVpmJKrTuGavz0pl+Y4KlzJB4MqQFdZsJdA50+fB+vzXiqVNAk\nGDEg/ZJE4gp833Wq5ag4J/OtP/zKU26m1Xcqn32BEO0nGt+KCG1dpZ4SoImat8Qd\nftNEYIGLzW7TCiWgfO8MBwaiDkP8RbOoov4VcQrswQKBgQDlpuh8eK2yGY6OmK91\nf+SXwas+RGwb0hurO6JW+tELg9dUtb04Yg/odfY/ff5KsGT9AfO+CnRNCkudHaia\nD5aTPDQssNFxY8ynftmBdvScTnZobRMbbrq3l+oAMypgeV9JyXKGAHW8L6LucGxG\nK9bhoLIYrkRAbJeVhlzel7MjOQKBgQC+igIvJTqKgfQN5UB7srI+YaO1QDLo5bxP\nSiltvrzIQsrh3E5DSiu9VqGrvrCQDlsOKP4OTdaByDj3bq0815u12+m3bH9MdzyV\ng8lq0R41lhdnv+s2fQPTnwSq9oiR84hkV3FpvqjTH7l0TtL5dH7bUY5/2lzRYQkv\nTLjDb2JQMQKBgGeZtVW5pzoqN1py3OyX5orjjpoHifG/BkZoH6M3gSi9sF2BozwV\nWPHYjV81Oot9KgHNaKT52F+M3nGhmJbvo1EGns7ucX3CtOd23S5/eHgvGVGgqzb7\n6/W47ZJrgpmFB4yk+SokePiNUOZaBy5cxpKAyPdDXnzlwDhvJeQw8VpZAoGAFDHI\nXXrSo492cGqV1QZxgc8TbMhrHOgMd1Li5TDMDWWW3y1cViFsVVrzM6K4T+xVlkCd\n/KIfVA4Gi6L9VW98n1+5e6lSLKaOk0IufNXBH+jSfjqHEXVajHlUI1KR0vY+xHPI\nH28HsaixHTSlg67nKxOPyNk58S8ZrBuzkXMitmECgYEAihThG4InkyqO7Qv/hiK6\nYHLLesVxTizdUMvfkNJOo2j2gK1NDliPtDHAcYmAPrYfToMIJl0nTv1cYvS9mvSp\nEW1IwN/Pk3X7uu7OFukj2C6PQEzjilEa3ZfdDlOvM6fsRIxrS86TsI82JMJh/PbU\nL6T/hqSAC9ezLBI9b/UQ/Fw=\n-----END PRIVATE KEY-----\n",
 
  // 📧 Service account email
  client_email:
    "firebase-adminsdk-fbsvc@ecommerce-50fcd.iam.gserviceaccount.com",

  // 🆔 Client ID
  client_id: "106031299910156159752",

  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url:
    "https://www.googleapis.com/oauth2/v1/certs",

  client_x509_cert_url:
    "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40ecommerce-50fcd.iam.gserviceaccount.com",
};


/* =========================================================
   INITIALIZE FIREBASE ADMIN
   ========================================================= */
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

/* =========================================================
   EXPORT ADMIN INSTANCE
   ========================================================= */
module.exports = admin;
