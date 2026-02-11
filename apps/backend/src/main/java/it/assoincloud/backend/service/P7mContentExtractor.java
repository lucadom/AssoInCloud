package it.assoincloud.backend.service;

import org.bouncycastle.cms.CMSSignedData;

/**
 * Extracts the original encapsulated content (e.g. XML) from a
 * PKCS#7 / CAdES .p7m signed file.
 *
 * <p>This does NOT verify the digital signature — it only unwraps
 * the CMS SignedData envelope to retrieve the embedded payload.</p>
 */
public class P7mContentExtractor {

    private P7mContentExtractor() {
        // utility class
    }

    /**
     * Extracts the original content bytes from a .p7m (PKCS#7/CMS SignedData) envelope.
     *
     * @param p7mBytes the raw bytes of the .p7m file
     * @return the encapsulated content (e.g. XML bytes)
     * @throws IllegalArgumentException if the signed data has a detached signature (no encapsulated content)
     * @throws RuntimeException if the byte array is not a valid CMS SignedData structure
     */
    public static byte[] extractContent(byte[] p7mBytes) {
        try {
            CMSSignedData signedData = new CMSSignedData(p7mBytes);

            if (signedData.getSignedContent() == null) {
                throw new IllegalArgumentException(
                        "Il file P7M contiene una firma distaccata e non include il contenuto originale");
            }

            return (byte[]) signedData.getSignedContent().getContent();
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Errore durante l'estrazione del contenuto dal file P7M: " + e.getMessage(), e);
        }
    }

    /**
     * Checks if the given file name has a .p7m extension (case-insensitive).
     */
    public static boolean isP7mFile(String fileName) {
        return fileName != null && fileName.toLowerCase().endsWith(".p7m");
    }
}
