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
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
};

export const byteArrayToBase64 = (bytes) => {
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
};

export const cleanBase64 = (b64) => {
    b64 = b64.replace(/[\r\n\s]/g, "").replace(/-/g, "+").replace(/_/g, "/");
    const pad = b64.length % 4;
    if (pad === 2) b64 += "==";
    else if (pad === 3) b64 += "=";
    else if (pad !== 0) throw new Error("Invalid base64 length");
    return b64;
};


export const importPrivateKeyFromBase64 = async (privateKeyBase64) => {
    const buffer = base64ToArrayBuffer(privateKeyBase64);
    return crypto.subtle.importKey(
        "pkcs8",
        buffer,
        { name: "RSA-OAEP", hash: "SHA-256" },
        false,
        ["decrypt"]
    );
};

export const decryptKeyWithRsa = async (encryptedKeyBase64, privateKey) => {
    const buffer = base64ToArrayBuffer(encryptedKeyBase64);
    return crypto.subtle.decrypt({ name: "RSA-OAEP" }, privateKey, buffer);
};

export const encryptKeyWithRsa = async (rawKeyBuffer, serverPublicKeyBase64) => {
    const serverBuffer = base64ToArrayBuffer(serverPublicKeyBase64);
    const importedKey = await crypto.subtle.importKey(
        "spki",
        serverBuffer,
        { name: "RSA-OAEP", hash: "SHA-256" },
        false,
        ["encrypt"]
    );
    const encrypted = await crypto.subtle.encrypt({ name: "RSA-OAEP" }, importedKey, rawKeyBuffer);
    return arrayBufferToBase64(encrypted);
};

export const importRSAPrivateKey = async (pkcs8Bytes) => {
    return crypto.subtle.importKey(
        "pkcs8",
        pkcs8Bytes,
        { name: "RSA-OAEP", hash: "SHA-256" },
        true,
        ["decrypt"]
    );
};

export const encryptDataWithAes = async (data, aesKey) => {
    const iv = crypto.getRandomValues(new Uint8Array(16));
    const buffer = new TextEncoder().encode(JSON.stringify(data));
    const cipherBuffer = await crypto.subtle.encrypt({ name: "AES-CBC", iv }, aesKey, buffer);
    return { cipherText: arrayBufferToBase64(cipherBuffer), iv: arrayBufferToBase64(iv.buffer) };
};

export const decryptDataWithAes = async (cipherTextBase64, ivBase64, keyBuffer) => {
    const cipherBuffer = base64ToArrayBuffer(cipherTextBase64);
    const ivBuffer = base64ToArrayBuffer(ivBase64);
    const aesKey = await crypto.subtle.importKey("raw", keyBuffer, { name: "AES-CBC" }, false, ["decrypt"]);
    const decryptedBuffer = await crypto.subtle.decrypt({ name: "AES-CBC", iv: ivBuffer }, aesKey, cipherBuffer);
    return new TextDecoder().decode(decryptedBuffer);
};

export const decryptWithSecretKey = async (secretKey, ivBase64, cipherTextBase64) => {
    const iv = Uint8Array.from(atob(ivBase64), c => c.charCodeAt(0));
    const cipherBytes = Uint8Array.from(atob(cipherTextBase64), c => c.charCodeAt(0));
    const decrypted = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv, tagLength: 128 },
        secretKey,
        cipherBytes
    );
    return new Uint8Array(decrypted);
};

export const decryptEncryptedPrivateKeyMethod = async (encryptedPrivateKeyBase64, secretKeyObject) => {
    const buffer = base64ToArrayBuffer(encryptedPrivateKeyBase64);
    return crypto.subtle.decrypt({ name: "AES-CBC", iv: secretKeyObject.iv }, secretKeyObject.aesKey, buffer);
};

export const restorePrivateKeyBytesMethod = async (decryptedPrivateKeyBytes) => JSON.parse(new TextDecoder().decode(decryptedPrivateKeyBytes));

export async function repairSecretKey(csr, saltBase64) {
    const encoder = new TextEncoder();
    const salt = Uint8Array.from(atob(saltBase64), c => c.charCodeAt(0));
    const keyMaterial = await crypto.subtle.importKey("raw", encoder.encode(csr), { name: "PBKDF2" }, false, ["deriveKey"]);
    return crypto.subtle.deriveKey(
        { name: "PBKDF2", salt, iterations: 65536, hash: "SHA-256" },
        keyMaterial,
        { name: "AES-CBC", length: 256 },
        true,
        ["encrypt", "decrypt"]
    );
}

export async function repairSecretKey2(csr, saltBase64) {
    const salt = Uint8Array.from(atob(saltBase64), c => c.charCodeAt(0));
    const keyMaterial = await crypto.subtle.importKey("raw", new TextEncoder().encode(csr), { name: "PBKDF2" }, false, ["deriveKey"]);
    return crypto.subtle.deriveKey(
        { name: "PBKDF2", salt, iterations: 200_000, hash: "SHA-256" },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        true,
        ["decrypt"]
    );
}

export async function generateCsr({ name, surname, father, fin, password }) {
    if (!name || !surname || !father || !fin || !password) 
        throw new Error('❌ "Ad, soyad, ata adı, fin və parol boş qala bilməz!"');

    const encoder = new TextEncoder();
    const data = encoder.encode(`${name}${surname}${father}${fin.toUpperCase()}${password}`);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const bytes = new Uint8Array(hashBuffer);

    let binary = '';
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
}