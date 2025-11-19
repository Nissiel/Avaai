# 🔍 SUPABASE - VÉRIFICATION URLS

## VA SUR SUPABASE DASHBOARD:

1. **Ouvre:** https://supabase.com/dashboard
2. **Projet:** Clique sur ton projet (zymlhofsintkycruwznc)
3. **Settings** → **Database**
4. **Scroll down** à "Connection string"

## TU DOIS VOIR 2 SECTIONS:

### 📍 Section 1: "Connection Pooling" (Transaction Mode)
```
URI:
postgresql://postgres.zymlhofsintkycruwznc:[YOUR-PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres

OU peut-être:
postgresql://postgres.zymlhofsintkycruwznc:[YOUR-PASSWORD]@aws-1-eu-west-1.pooler.supabase.com:6543/postgres
```

### 📍 Section 2: "Direct connection" (Session Mode)
```
URI:
postgresql://postgres.zymlhofsintkycruwznc:[YOUR-PASSWORD]@db.zymlhofsintkycruwznc.supabase.co:5432/postgres
```

---

## ⚠️ PROBLÈME IPv6:

Le host `db.zymlhofsintkycruwznc.supabase.co` a:
- ✅ IPv4: OK
- ❌ IPv6: Render ne peut pas y accéder!

---

## 🎯 SOLUTION DÉFINITIVE:

### Option A: Pooler (CE QUI MARCHAIT AVANT)

**URL pour Render:**
```
postgresql+asyncpg://postgres.zymlhofsintkycruwznc:Bichon55!!??@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
```

**OU** (vérifie sur Supabase quel region):
```
postgresql+asyncpg://postgres.zymlhofsintkycruwznc:Bichon55!!??@aws-1-eu-west-1.pooler.supabase.com:6543/postgres
```

**Avantages:**
- ✅ Marche avec IPv4 ET IPv6
- ✅ C'est ce que tu utilisais avant
- ✅ On a déjà fixé le code (statement_cache_size=0)

---

## 🚨 ACTION IMMÉDIATE:

1. **Va sur Supabase Dashboard**
2. **Copie** EXACTEMENT l'URL de "Connection Pooling"
3. **Remplace** `postgresql://` par `postgresql+asyncpg://`
4. **Mets** ton password: `Bichon55!!??`
5. **Colle** sur Render dans `AVA_API_DATABASE_URL`

**Format final attendu:**
```
postgresql+asyncpg://postgres.zymlhofsintkycruwznc:Bichon55!!??@aws-X-eu-XXX.pooler.supabase.com:6543/postgres
```

(Remplace `aws-X-eu-XXX` par ce que Supabase affiche)

---

## ✅ POURQUOI ÇA VA MARCHER:

1. ✅ Pooler host supporte IPv4 ET IPv6
2. ✅ Code déjà fixé avec statement_cache_size=0
3. ✅ C'est l'URL originale qui marchait
4. ✅ Pas de changement d'architecture
