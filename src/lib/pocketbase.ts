import Pocketbase from "pocketbase";

const pb = new Pocketbase(process.env.NEXT_PUBLIC_PB_URL);

if (process.env.NODE_ENV === "development") pb.autoCancellation(false);

export default pb;