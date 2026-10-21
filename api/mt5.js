// Vercel serverless endpoint for the MT5 bridge.
// Set YC_MT5_TOKEN in Vercel Environment Variables before using live MT5 data.
export default function handler(req,res){
  if(req.method!=="POST") return res.status(405).json({ok:false,error:"POST required"});
  const expected=process.env.YC_MT5_TOKEN;
  if(!expected) return res.status(503).json({ok:false,error:"Bridge token is not configured"});
  const auth=req.headers.authorization||"";
  if(auth!==("Bearer "+expected)) return res.status(401).json({ok:false,error:"Unauthorized"});
  const {symbol,timeframe,bid,ask,candles}=req.body||{};
  if(!symbol||!Array.isArray(candles)||candles.length<55) return res.status(400).json({ok:false,error:"Invalid candle payload"});
  // V1 receives and validates MT5 data. Persistent storage/live signal delivery is the next layer.
  return res.status(200).json({ok:true,symbol,timeframe,bid,ask,candlesReceived:candles.length,mode:"manual-signals"});
}
