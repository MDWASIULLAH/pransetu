package com.pransetu.emergency

import android.util.Base64
import java.security.SecureRandom
import javax.crypto.Cipher
import javax.crypto.spec.GCMParameterSpec
import javax.crypto.spec.SecretKeySpec

object EncryptionUtils {
    // For this prototype, we use a pre-shared 256-bit AES key.
    // In production, the Android app would encrypt with the EOC's RSA Public Key
    // ensuring absolute zero-knowledge routing for intermediate nodes.
    private val PRE_SHARED_KEY = "pransetu-sih2026-secure-key-1234".toByteArray(Charsets.UTF_8)
    private const val ALGORITHM = "AES/GCM/NoPadding"
    private const val TAG_LENGTH_BIT = 128
    private const val IV_LENGTH_BYTE = 12

    fun encrypt(payload: String): String {
        val iv = ByteArray(IV_LENGTH_BYTE)
        SecureRandom().nextBytes(iv)

        val cipher = Cipher.getInstance(ALGORITHM)
        val keySpec = SecretKeySpec(PRE_SHARED_KEY, "AES")
        val gcmParameterSpec = GCMParameterSpec(TAG_LENGTH_BIT, iv)

        cipher.init(Cipher.ENCRYPT_MODE, keySpec, gcmParameterSpec)
        val cipherText = cipher.doFinal(payload.toByteArray(Charsets.UTF_8))

        // Prepend IV to ciphertext for use in decryption
        val cipherTextWithIv = ByteArray(iv.size + cipherText.size)
        System.arraycopy(iv, 0, cipherTextWithIv, 0, iv.size)
        System.arraycopy(cipherText, 0, cipherTextWithIv, iv.size, cipherText.size)

        return Base64.encodeToString(cipherTextWithIv, Base64.NO_WRAP)
    }

    fun decrypt(encryptedPayloadBase64: String): String {
        val cipherTextWithIv = Base64.decode(encryptedPayloadBase64, Base64.NO_WRAP)
        
        val iv = ByteArray(IV_LENGTH_BYTE)
        System.arraycopy(cipherTextWithIv, 0, iv, 0, iv.size)
        
        val cipherText = ByteArray(cipherTextWithIv.size - iv.size)
        System.arraycopy(cipherTextWithIv, iv.size, cipherText, 0, cipherText.size)

        val cipher = Cipher.getInstance(ALGORITHM)
        val keySpec = SecretKeySpec(PRE_SHARED_KEY, "AES")
        val gcmParameterSpec = GCMParameterSpec(TAG_LENGTH_BIT, iv)

        cipher.init(Cipher.DECRYPT_MODE, keySpec, gcmParameterSpec)
        val plainText = cipher.doFinal(cipherText)

        return String(plainText, Charsets.UTF_8)
    }
}
