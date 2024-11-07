import PocketBase from "pocketbase";

const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL);

if (typeof window !== "undefined") {
  console.log("PocketBase URL:", process.env.NEXT_PUBLIC_POCKETBASE_URL);
  pb.authStore.loadFromCookie(document.cookie);
}

export default pb;
