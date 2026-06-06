# Soriya Client Framework - User Service

## Setup

```typescript
import { Soriya } from '@miyuna/client-framework';

const soriya = new Soriya({
  services: {
    userService: 'https://api.user.example.com',
    notificationService: 'https://api.notification.example.com'
  }
});
```

Semua URL service wajib didefinisikan. Constructor akan throw error jika ada yang kosong.

---

## Authentication

### Register

```typescript
const response = await soriya.user.register({
  ownerEmail: 'user@example.com',
  username: 'johndoe',
  password: 'securepassword123'
});

// response.data berisi:
// - accessToken
// - refreshToken
// - user info
```

### Login

```typescript
const response = await soriya.user.login({
  ownerEmail: 'user@example.com',
  password: 'securepassword123'
});

// response.data berisi:
// - refreshToken (otomatis disimpan di framework)
// - profiles[] (daftar profil user untuk dipilih)
// - message
```

`refreshToken` otomatis disimpan di internal state. Tidak perlu dikelola manual.

### Select Profile

Setelah login, user harus memilih profil untuk mendapat `accessToken`.

```typescript
// Menggunakan accessToken yang sudah ada (default)
const response = await soriya.user.selectProfile('user-id-123');

// Atau menggunakan refreshToken (saat belum punya accessToken)
const response = await soriya.user.selectProfile('user-id-123', 'refresh');

// response.data berisi:
// - accessToken (otomatis di-set ke header Authorization)
// - user data profil aktif
```

Setelah `selectProfile`, semua request berikutnya otomatis membawa header `Authorization: Bearer <accessToken>`.

### Logout

```typescript
await soriya.user.logout();
```

Membersihkan `accessToken`, `refreshToken`, dan header `Authorization` dari framework. State dibersihkan meskipun request logout ke server gagal.

---

## Token Auto-Refresh

Framework menangani token refresh secara otomatis:

1. Request API mengembalikan `401 Unauthorized`.
2. Framework memanggil `/refresh` menggunakan `refreshToken` yang tersimpan.
3. `accessToken` baru di-set ke header, request awal diulang otomatis.
4. Jika refresh gagal, sesi dibersihkan (logout) dan error dilempar ke caller.

Tidak perlu kode tambahan di sisi aplikasi.

---

## Security Phrase

### Buat Security Phrase

```typescript
await soriya.user.manageSecurityPhrase('create', 'word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12');
```

### Verifikasi Security Phrase

```typescript
await soriya.user.manageSecurityPhrase('verify', 'word1 word2 ... word12');
```

### Reset via Security Phrase

```typescript
await soriya.user.manageSecurityPhrase('reset', 'word1 word2 ... word12');
```

---

## User Data

```typescript
const response = await soriya.user.getUser('user-id-123');

// response.data berisi data user
```

---

## Error Handling

Semua error dari framework mengikuti format:

```typescript
try {
  await soriya.user.login({ ownerEmail: 'x', password: 'y' });
} catch (error) {
  // error.status  - HTTP status code (0 jika network error)
  // error.message - Pesan error
  // error.data    - Response body dari server (jika ada)
}
```

| Kondisi | Perilaku |
|---|---|
| Server error (4xx/5xx) | `{ message, status, data }` |
| Network error | `{ message: 'Network Error', status: 0 }` |
| Token expired (401) | Auto-refresh, retry request |
| Refresh gagal | Logout otomatis, error dilempar |

---

## Contoh Alur Lengkap

```typescript
import { Soriya } from '@miyuna/client-framework';

const soriya = new Soriya({
  services: {
    userService: 'https://api.user.example.com',
    notificationService: 'https://api.notification.example.com'
  }
});

// 1. Register
await soriya.user.register({
  ownerEmail: 'user@example.com',
  username: 'johndoe',
  password: 'password123'
});

// 2. Login
const loginRes = await soriya.user.login({
  ownerEmail: 'user@example.com',
  password: 'password123'
});

// 3. Pilih profil dari daftar
const profiles = loginRes.data.profiles;
await soriya.user.selectProfile(profiles[0].id);

// 4. Akses data (token sudah ter-set otomatis)
const userData = await soriya.user.getUser(profiles[0].id);

// 5. Logout
await soriya.user.logout();
```
