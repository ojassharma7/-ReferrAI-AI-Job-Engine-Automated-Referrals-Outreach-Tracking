# Fix OAuth Redirect URI Mismatch Error

## Error Message
```
Error 400: redirect_uri_mismatch
```

## Quick Fix

### Step 1: Go to Google Cloud Console
1. Open: https://console.cloud.google.com/apis/credentials
2. Make sure you're in the correct project

### Step 2: Edit Your OAuth Client
1. Find your OAuth 2.0 Client ID (the one for Gmail)
2. Click on it to open the edit page

### Step 3: Add OAuth Playground Redirect URI
1. Scroll down to "Authorized redirect URIs"
2. Click "+ ADD URI"
3. Add this exact URI:
   ```
   https://developers.google.com/oauthplayground
   ```
4. Click "Save"

### Step 4: Try OAuth Playground Again
1. Go back to: https://developers.google.com/oauthplayground
2. Click the gear icon (⚙️) in top right
3. Check "Use your own OAuth credentials"
4. Enter your Client ID and Client Secret
5. Try the authorization flow again

## Alternative: Use a Different Redirect URI

If you prefer to use `urn:ietf:wg:oauth:2.0:oob` (which is what the code uses):

1. In OAuth Client settings, add:
   ```
   urn:ietf:wg:oauth:2.0:oob
   ```

2. But OAuth Playground won't work with this - you'd need to use a different method

## Recommended: Use OAuth Playground's URI

The easiest solution is to add OAuth Playground's redirect URI to your OAuth client, as shown in Step 3 above.

## After Fixing

Once you've added the redirect URI and saved:
- Go back to OAuth Playground
- The authorization should work now
- You'll be able to get your refresh token

