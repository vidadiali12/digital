
export const base64ToArrayBuffer = (base64) => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
};

export const arrayBufferToBase64 = (buffer) => {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
};

export function byteArrayToBase64(wordBytes) {
    let binary = '';
    for (let i = 0; i < wordBytes.length; i++) {
        binary += String.fromCharCode(wordBytes[i]);
    }
    return btoa(binary);
}

export const encryptKeyWithRsa = async (rawAesKeyBuffer, serverPublicKeyBase64) => {
    const serverKeyBuffer = base64ToArrayBuffer(serverPublicKeyBase64);
    const importedServerPublicKey = await window.crypto.subtle.importKey(
        "spki",
        serverKeyBuffer,
        { name: "RSA-OAEP", hash: "SHA-256" },
        false,
        ["encrypt"]
    );
    const encryptedKeyBuffer = await window.crypto.subtle.encrypt(
        { name: "RSA-OAEP" },
        importedServerPublicKey,
        rawAesKeyBuffer
    );
    return arrayBufferToBase64(encryptedKeyBuffer);
};

export const encryptDataWithAes = async (requestDataJson, aesKey) => {
    const iv = window.crypto.getRandomValues(new Uint8Array(16));
    const dataBuffer = new TextEncoder().encode(JSON.stringify(requestDataJson));
    const cipherTextBuffer = await window.crypto.subtle.encrypt({ name: "AES-CBC", iv }, aesKey, dataBuffer);
    return { cipherText: arrayBufferToBase64(cipherTextBuffer), iv: arrayBufferToBase64(iv.buffer) };
};

export const importPrivateKeyFromBase64 = async (privateKeyBase64) => {
    const privateKeyBuffer = base64ToArrayBuffer(privateKeyBase64);
    return await window.crypto.subtle.importKey(
        "pkcs8",
        privateKeyBuffer,
        { name: "RSA-OAEP", hash: "SHA-256" },
        false,
        ["decrypt"]
    );
};


export const decryptKeyWithRsa = async (encryptedKeyBase64, importedPrivateKey) => {
    const encryptedKeyBuffer = base64ToArrayBuffer(encryptedKeyBase64);
    return await window.crypto.subtle.decrypt({ name: "RSA-OAEP" }, importedPrivateKey, encryptedKeyBuffer);
};

export const decryptDataWithAes = async (cipherTextBase64, ivBase64, decryptedKeyBuffer) => {
    const cipherTextBuffer = base64ToArrayBuffer(cipherTextBase64);
    const ivBuffer = base64ToArrayBuffer(ivBase64);
    const aesKey = await window.crypto.subtle.importKey("raw", decryptedKeyBuffer, { name: "AES-CBC" }, false, ["decrypt"]);
    const decryptedBuffer = await window.crypto.subtle.decrypt({ name: "AES-CBC", iv: ivBuffer }, aesKey, cipherTextBuffer);
    return new TextDecoder().decode(decryptedBuffer);
};

export const decryptEncryptedPrivateKeyMethod = async (encryptedPrivateKeyBase64, secretKeyObject) => {
    const encryptedPrivateKeyBuffer = base64ToArrayBuffer(encryptedPrivateKeyBase64);
    return await window.crypto.subtle.decrypt({ name: "AES-CBC", iv: secretKeyObject.iv }, secretKeyObject.aesKey, encryptedPrivateKeyBuffer);
};

export const restorePrivateKeyBytesMethod = async (decryptedPrivateKeyBytes) => JSON.parse(new TextDecoder().decode(decryptedPrivateKeyBytes));


export async function repairSecretKey(csr, saltBase64) {
    const encoder = new TextEncoder();
    const salt = Uint8Array.from(atob(saltBase64), c => c.charCodeAt(0));
    const csrKeyMaterial = await crypto.subtle.importKey(
        "raw",
        encoder.encode(csr),
        { name: "PBKDF2" },
        false,
        ["deriveKey"]
    );

    const key = await crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt,
            iterations: 65536,
            hash: "SHA-256"
        },
        csrKeyMaterial,
        { name: "AES-CBC", length: 256 },
        true,
        ["encrypt", "decrypt"]
    );

    return key;
}

export async function generateCsr({ name, surname, father, fin, password }) {
    if (!name || !surname || !father || !fin || !password)
        throw new Error('❌ "Ad, soyad, ata adı, fin və  parol boş qala bilməz!"');

    const encoder = new TextEncoder();
    const data = encoder.encode(`${name}${surname}${father}${fin.toUpperCase()}${password}`);
    
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const bytes = new Uint8Array(hashBuffer);

    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
    }

    return btoa(binary);
}

const PBKDF2_ITER = 200_000;
const AES_KEY_BITS = 256;
const GCM_TAG_LEN = 128; // bits

// 1) PBKDF2 → AES-GCM açarı yaratmaq
export async function repairSecretKey2(csr, saltBase64) {
    const salt = Uint8Array.from(atob(saltBase64), c => c.charCodeAt(0));

    const keyMaterial = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(csr),
        { name: "PBKDF2" },
        false,
        ["deriveKey"]
    );

    return crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt,
            iterations: 200_000,
            hash: "SHA-256"
        },
        keyMaterial,
        {
            name: "AES-GCM",
            length: 256
        },
        true,
        ["decrypt"]
    );
}
// 2) AES-GCM decrypt
export async function decryptWithSecretKey(secretKey, ivBase64, cipherTextBase64) {
    const iv = Uint8Array.from(atob(ivBase64), c => c.charCodeAt(0));
    const cipherBytes = Uint8Array.from(atob(cipherTextBase64), c => c.charCodeAt(0));

    const decrypted = await crypto.subtle.decrypt(
        {
            name: "AES-GCM",
            iv,
            tagLength: 128            // Java GCM_TAG_LEN = 128 bits
        },
        secretKey,
        cipherBytes
    );

    return new Uint8Array(decrypted);  // PKCS8 private key bytes
}

// 3) RSA PKCS#8 private key import
export async function importRSAPrivateKey(pkcs8Bytes) {
    return crypto.subtle.importKey(
        "pkcs8",
        pkcs8Bytes,
        {
            name: "RSA-OAEP",
            hash: "SHA-256"
        },
        true,
        ["decrypt"]
    );
}

export function cleanBase64(b64) {
    b64 = b64
        .replace(/[\r\n\s]/g, "")
        .replace(/-/g, "+")
        .replace(/_/g, "/");

    const pad = b64.length % 4;
    if (pad === 2) b64 += "==";
    else if (pad === 3) b64 += "=";
    else if (pad !== 0) throw new Error("Invalid base64 length");

    return b64;
}