# PocketBase Schema Setup Guide

## Manual Collection Setup Instructions

Follow these steps to create the database schema manually in PocketBase Admin UI (`http://127.0.0.1:8090/_/`).

---

## 1. Users Collection (Auth)

**Collection Settings:**
- **Name:** `users`
- **Type:** Auth collection
- **API Rules:**
  - List: `` (empty = public)
  - View: `` (empty = public)
  - Create: `` (empty = public)
  - Update: `@request.auth.id = id`
  - Delete: `@request.auth.id = id`

**Fields to Add:**

1. **name**
   - Type: Text
   - Required: ✓
   
2. **avatar**
   - Type: File
   - Max select: 1
   - Max size: 5MB (5242880 bytes)

3. **about**
   - Type: Text
   - Required: ✗
   - Max length: 500 characters (optional)

---

## 2. Snippets Collection

**Collection Settings:**
- **Name:** `snippets`
- **Type:** Base collection
- **API Rules:**
  - List: `` (empty = public)
  - View: `` (empty = public)
  - Create: `@request.auth.id != ''`
  - Update: `@request.auth.id = author`
  - Delete: `@request.auth.id = author`

**Fields to Add:**

1. **title**
   - Type: Text
   - Required: ✓

2. **code**
   - Type: Text
   - Required: ✓

3. **language**
   - Type: Select (single)
   - Required: ✓
   - Values: `javascript`, `typescript`, `python`, `java`, `cpp`, `csharp`, `go`, `rust`, `html`, `css`, `json`, `sql`

4. **description**
   - Type: Text
   - Required: ✗

5. **author**
   - Type: Relation
   - Required: ✓
   - Collection: `users`
   - Max select: 1
   - Cascade delete: ✗

6. **visibility**
   - Type: Select (single)
   - Required: ✓
   - Values: `public`, `private`

7. **forked_from**
   - Type: Relation
   - Required: ✗
   - Collection: `snippets` (self-reference)
   - Max select: 1
   - Cascade delete: ✗

---

## 3. Comments Collection

**Collection Settings:**
- **Name:** `comments`
- **Type:** Base collection
- **API Rules:**
  - List: `` (empty = public)
  - View: `` (empty = public)
  - Create: `@request.auth.id = @request.data.author`
  - Update: `@request.auth.id = author`
  - Delete: `@request.auth.id = author`

**Fields to Add:**

1. **content**
   - Type: Text
   - Required: ✓

2. **author**
   - Type: Relation
   - Required: ✓
   - Collection: `users`
   - Max select: 1
   - Cascade delete: ✗

3. **snippet**
   - Type: Relation
   - Required: ✓
   - Collection: `snippets`
   - Max select: 1
   - Cascade delete: ✓ (when snippet is deleted, delete its comments)

4. **parent**
   - Type: Relation
   - Required: ✗ (top-level comments have no parent)
   - Collection: `comments` (self-reference)
   - Max select: 1
   - Cascade delete: ✓ (when parent comment is deleted, delete all replies)

---

## 4. Upvotes Collection

**Collection Settings:**
- **Name:** `upvotes`
- **Type:** Base collection
- **API Rules:**
  - List: `` (empty = public)
  - View: `` (empty = public)
  - Create: `@request.auth.id = @request.data.userid`
  - Update: `@request.auth.id = userid`
  - Delete: `@request.auth.id = userid`

**Fields to Add:**

1. **userid**
   - Type: Relation
   - Required: ✓
   - Collection: `users`
   - Max select: 1
   - Cascade delete: ✓

2. **snippet**
   - Type: Relation
   - Required: ✓
   - Collection: `snippets`
   - Max select: 1
   - Cascade delete: ✓

**Indexes:**
- Go to the collection's "Indexes" tab
- Add this index:
  ```sql
  CREATE UNIQUE INDEX idx_user_snippet ON upvotes (userid, snippet)
  ```
  This ensures each user can only upvote a snippet once.

---

## 5. Comment Upvotes Collection

**Collection Settings:**
- **Name:** `comment_upvotes`
- **Type:** Base collection
- **API Rules:**
  - List: `` (empty = public)
  - View: `` (empty = public)
  - Create: `@request.auth.id = @request.data.userid`
  - Update: `@request.auth.id = userid`
  - Delete: `@request.auth.id = userid`

**Fields to Add:**

1. **userid**
   - Type: Relation
   - Required: ✓
   - Collection: `users`
   - Max select: 1
   - Cascade delete: ✓

2. **comment**
   - Type: Relation
   - Required: ✓
   - Collection: `comments`
   - Max select: 1
   - Cascade delete: ✓

**Indexes:**
- Go to the collection's "Indexes" tab
- Add this index:
  ```sql
  CREATE UNIQUE INDEX idx_user_comment ON comment_upvotes (userid, comment)
  ```
  This ensures each user can only upvote a comment once.

---

## Verification

After creating all collections, you should have:
- ✓ `users` (auth collection with `name`, `avatar`, and `about`)
- ✓ `snippets` (with 7 fields including relations)
- ✓ `comments` (with 4 fields including nested replies)
- ✓ `upvotes` (with 2 fields and unique index)
- ✓ `comment_upvotes` (with 2 fields and unique index)

Now run your app with `bun run dev` and it should work!

---

## Notes

- **Empty rules (``)** = publicly accessible
- **author** field in rules refers to the relation field directly (not `author.id`)
- **userid** field name avoids SQL reserved word `user`
- The unique index on `upvotes` prevents duplicate votes
