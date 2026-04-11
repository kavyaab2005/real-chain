import { io } from "socket.io-client";

const API_URL = "http://localhost:5000/api";
export const socket = io("http://localhost:5000");

// ── Properties ─────────────────────────────────────────────────

export const fetchAllProperties = async () => {
  const res = await fetch(`${API_URL}/properties`);
  const data = await res.json();
  return data.data;
};

export const fetchProperty = async (id) => {
  const res = await fetch(`${API_URL}/properties/${id}`);
  const data = await res.json();
  return data.data;
};

export const fetchPropertyHistory = async (id) => {
  const res = await fetch(`${API_URL}/properties/${id}/history`);
  const data = await res.json();
  return data.data;
};

// ── User ───────────────────────────────────────────────────────

export const fetchUserProperties = async (address) => {
  const res = await fetch(`${API_URL}/user/${address}/properties`);
  const data = await res.json();
  return data.data;
};

// ── Analytics ──────────────────────────────────────────────────

export const fetchAnalytics = async () => {
  const res = await fetch(`${API_URL}/analytics`);
  const data = await res.json();
  return data.data;
};

// ── Transactions ───────────────────────────────────────────────

export const fetchTransactions = async () => {
  const res = await fetch(`${API_URL}/transactions`);
  const data = await res.json();
  return data.data;
};

// ── Notifications ──────────────────────────────────────────────

export const fetchNotifications = async () => {
  const res = await fetch(`${API_URL}/notifications`);
  const data = await res.json();
  return data.data;
};

// ── IPFS Upload ────────────────────────────────────────────────

export const uploadImageToIPFS = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = reader.result.split(",")[1];
        const res = await fetch(`${API_URL}/upload/image`, {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({
            imageBase64: base64,
            filename:    file.name,
          }),
        });
        const data = await res.json();
        resolve(`ipfs://${data.ipfsHash}`);
      } catch (err) {
        reject(err);
      }
    };
    reader.readAsDataURL(file);
  });
};

export const uploadMetadataToIPFS = async (metadata) => {
  const res = await fetch(`${API_URL}/upload/metadata`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(metadata),
  });
  const data = await res.json();
  return `ipfs://${data.ipfsHash}`;
};