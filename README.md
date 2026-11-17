# Facebook Page Fetch Action

Fetches posts from a Facebook Page and saves them as monthly JSON files, with
images for posts that include a full picture.

## Create a long-lived Page access token

The action needs a **Page access token** for the Page identified by `page-id`.
An ordinary user access token or app access token is not a substitute. A Page
access token obtained from a long-lived user access token has no expiration
date, but it can still be invalidated (for example, if permissions are removed
or the person loses access to the Page).

1. Make sure your Meta developer app has access to the Facebook Page and your
   Facebook account has the necessary Page permissions.
2. In the [Graph API Explorer](https://developers.facebook.com/tools/explorer/),
   select your app and generate a **user access token** with
   `pages_show_list` and `pages_read_engagement`. Meta may require app review
   or additional access for these permissions.
3. Find the app credentials in the
   [Meta for Developers App Dashboard](https://developers.facebook.com/apps/):
   open your app and go to **App settings → Basic**. The **App ID** is
   `META_APP_ID`; reveal or copy the **App Secret** as `META_APP_SECRET`.
   Treat the App Secret like a password and do not put it in this action's
   inputs or GitHub workflow.
4. Exchange that short-lived user token for a long-lived user token with this
   `curl` command. Run it in a trusted local environment or on your server,
   after setting the four environment variables to your values. Replace
   `vXX.0` with a Graph API version supported by your app.

   ```text
   GRAPH_API_VERSION=vXX.0
   META_APP_ID=your-app-id
   META_APP_SECRET=your-app-secret
   FB_USER_ACCESS_TOKEN=your-short-lived-user-token
   ```

   ```sh
   curl --fail-with-body --get \
     "https://graph.facebook.com/${GRAPH_API_VERSION}/oauth/access_token" \
     --data-urlencode "grant_type=fb_exchange_token" \
     --data-urlencode "client_id=${META_APP_ID}" \
     --data-urlencode "client_secret=${META_APP_SECRET}" \
     --data-urlencode "fb_exchange_token=${FB_USER_ACCESS_TOKEN}"
   ```

   The response contains a new `access_token` and `expires_in` (in seconds).
   Use the new token in the next step. Do not use an expired token for this
   exchange. Keep your app secret private: make this request only from a
   trusted server or local environment, never from a browser, workflow file,
   or client-side app. Do not commit the environment variables or share the
   command output; the response contains a credential.
5. Using the long-lived **user** token, request
   `/{user-id}/accounts?fields=id,name,access_token` (or `/me/accounts`).
   Find your Page in the response. Its `id` is the `page-id`; its
   `access_token` is the long-lived **Page** token to use as `page-token`.

See Meta's documentation for
[exchanging for long-lived tokens](https://developers.facebook.com/docs/facebook-login/guides/access-tokens/get-long-lived/)
and [access tokens](https://developers.facebook.com/docs/facebook-login/guides/access-tokens/)
for current API details. If the action later reports an access-token validation
error, check the token and Page permissions and generate a replacement if
needed.

## Store the token in GitHub

In your repository, go to **Settings → Secrets and variables → Actions → New
repository secret** and add a secret named `FB_PAGE_TOKEN` containing the Page
access token. Do not commit the token, put it directly in a workflow file, or
print it in logs.

You can store the Page ID as an Actions variable named `FB_PAGE_ID` under
**Settings → Secrets and variables → Actions → Variables**.

## Usage

```yaml
steps:
  - uses: lauravuo/fb-fetch-action@v1
    with:
      page-id: ${{ vars.FB_PAGE_ID }}
      page-token: ${{ secrets.FB_PAGE_TOKEN }}
      start-year: "2022"
      data-folder: "./data/fb/"
```

Replace `lauravuo/fb-fetch-action@v1` with the repository and ref you use if
you consume this action from a fork or a different release.

## Inputs

| Input | Required | Default | Description |
|---|---|---|---|
| `page-id` | Yes | — | ID of the Facebook Page to fetch. |
| `page-token` | Yes | — | Page access token for that Page. Store it as a GitHub secret. |
| `data-folder` | No | `./data/fb/` | Folder where monthly JSON files and images are saved. |
| `start-year` | No | `2022` | First year to fetch when the data folder does not exist yet. |

On the initial run, the action fetches posts from `start-year` through the
current date. When the data folder already exists, it refreshes the previous
and current month.
