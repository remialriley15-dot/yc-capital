#property strict
#property version "1.00"
#property description "YC Capital MT5 data bridge - sends closed XAUUSD candles to the YC Capital API. Does not place trades."

input string ApiUrl="https://yc-capital.vercel.app/api/mt5";
input string ApiToken="CHANGE_ME";
input ENUM_TIMEFRAMES SignalTimeframe=PERIOD_M15;
input int SendEverySeconds=30;

datetime lastSend=0;

int OnInit(){
   EventSetTimer(SendEverySeconds);
   Print("YC Capital Bridge started. Add https://yc-capital.vercel.app to Tools > Options > Expert Advisors > Allow WebRequest.");
   return(INIT_SUCCEEDED);
}
void OnDeinit(const int reason){EventKillTimer();}

string CandleJson(MqlRates &r){
   return StringFormat("{\"time\":%I64d,\"open\":%.5f,\"high\":%.5f,\"low\":%.5f,\"close\":%.5f,\"tick_volume\":%I64d}",
      (long)r.time,r.open,r.high,r.low,r.close,(long)r.tick_volume);
}
void OnTimer(){
   MqlRates rates[];
   ArraySetAsSeries(rates,true);
   int copied=CopyRates(_Symbol,SignalTimeframe,1,60,rates); // closed candles only
   if(copied<55){Print("YC Capital: not enough candles yet");return;}
   string candles="[";
   for(int i=copied-1;i>=0;i--){candles+=CandleJson(rates[i]);if(i>0)candles+=",";}
   candles+="]";
   double bid=SymbolInfoDouble(_Symbol,SYMBOL_BID),ask=SymbolInfoDouble(_Symbol,SYMBOL_ASK);
   string body=StringFormat("{\"symbol\":\"%s\",\"timeframe\":%d,\"bid\":%.5f,\"ask\":%.5f,\"candles\":%s}",_Symbol,(int)SignalTimeframe,bid,ask,candles);
   char data[],result[]; string headers="Content-Type: application/json\r\nAuthorization: Bearer "+ApiToken+"\r\n",responseHeaders;
   StringToCharArray(body,data,0,WHOLE_ARRAY,CP_UTF8);
   int code=WebRequest("POST",ApiUrl,headers,8000,data,result,responseHeaders);
   if(code<0)Print("YC Capital WebRequest error: ",GetLastError());
   else Print("YC Capital API HTTP ",code,": ",CharArrayToString(result));
}
