package com.dere3046.tseet

import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import org.bouncycastle.asn1.*
import java.io.ByteArrayInputStream
import java.security.KeyPairGenerator
import java.security.KeyStore
import java.security.cert.X509Certificate

object VBHashExtractor {

    private const val KEY_ALIAS = "attestation_key_v1"
    private const val KEY_ATTESTATION_OID = "1.3.6.1.4.1.11129.2.1.17"
    private const val TAG_ROOT_OF_TRUST = 704

    data class Result(
        val hash: String?,
        val error: String?
    )

    fun extract(): Result {
        return try {
            val keyStore = KeyStore.getInstance("AndroidKeyStore").apply { load(null) }

            if (keyStore.containsAlias(KEY_ALIAS)) {
                keyStore.deleteEntry(KEY_ALIAS)
            }

            val kpg = KeyPairGenerator.getInstance(
                KeyProperties.KEY_ALGORITHM_EC, "AndroidKeyStore"
            )
            val spec = KeyGenParameterSpec.Builder(
                KEY_ALIAS,
                KeyProperties.PURPOSE_SIGN or KeyProperties.PURPOSE_VERIFY
            )
                .setDigests(KeyProperties.DIGEST_SHA256)
                .setAttestationChallenge("hello_world_challenge".toByteArray())
                .build()
            kpg.initialize(spec)
            kpg.generateKeyPair()

            val certs = keyStore.getCertificateChain(KEY_ALIAS)
            if (certs == null || certs.isEmpty()) {
                return Result(null, "Failed to get certificate chain")
            }

            val leafCert = certs[0] as X509Certificate
            val hashBytes = extractVerifiedBootHash(leafCert)

            if (hashBytes != null) {
                Result(bytesToHex(hashBytes), null)
            } else {
                Result(null, "Hash not found in certificate extension")
            }
        } catch (e: Exception) {
            Result(null, "Exception: ${e.message}")
        }
    }

    private fun extractVerifiedBootHash(cert: X509Certificate): ByteArray? {
        val extensionValue = cert.getExtensionValue(KEY_ATTESTATION_OID) ?: return null

        var extensionStruct = toAsn1Primitive(extensionValue)
        if (extensionStruct is ASN1OctetString) {
            extensionStruct = toAsn1Primitive(extensionStruct.octets)
        }

        if (extensionStruct !is ASN1Sequence) return null

        val teeEnforced = extensionStruct.getObjectAt(7) as? ASN1Sequence
        var rootOfTrustSeq = teeEnforced?.let { findRootOfTrust(it) }

        if (rootOfTrustSeq == null) {
            val swEnforced = extensionStruct.getObjectAt(6) as? ASN1Sequence
            rootOfTrustSeq = swEnforced?.let { findRootOfTrust(it) }
        }

        if (rootOfTrustSeq == null) return null

        return if (rootOfTrustSeq.size() >= 4) {
            val hashObj = rootOfTrustSeq.getObjectAt(3)
            if (hashObj is ASN1OctetString) {
                hashObj.octets
            } else {
                null
            }
        } else {
            null
        }
    }

    private fun findRootOfTrust(authList: ASN1Sequence): ASN1Sequence? {
        for (i in 0 until authList.size()) {
            val obj = authList.getObjectAt(i)
            if (obj is ASN1TaggedObject) {
                if (obj.tagNo == TAG_ROOT_OF_TRUST) {
                    val inner = obj.baseObject.toASN1Primitive()
                    if (inner is ASN1Sequence) {
                        return inner
                    }
                }
            }
        }
        return null
    }

    private fun toAsn1Primitive(data: ByteArray): ASN1Primitive {
        return ASN1InputStream(ByteArrayInputStream(data)).use { it.readObject() }
    }

    private fun bytesToHex(bytes: ByteArray): String {
        return bytes.joinToString("") { "%02x".format(it) }
    }
}
