async function call(url,token){
  const r=await fetch(url,{
    headers:{Authorization:'Bearer '+token,Accept:'application/json'}
  });
  const text=await r.text();
  let data={};
  try{data=text?JSON.parse(text):{}}catch{data={raw:text.slice(0,300)}}
  return {
    ok:r.ok,
    httpStatus:r.status,
    error:data?.error||null,
    message:data?.message||null,
    // somente campos não sensíveis
    userId:data?.id||null,
    nickname:data?.nickname||null,
    productCount:Array.isArray(data?.results)?data.results.length:null
  };
}

module.exports=async function handler(req,res){
  const token=process.env.MELI_ACCESS_TOKEN;
  res.setHeader('Cache-Control','no-store');

  if(!token){
    return res.status(200).json({
      configured:false,
      message:'MELI_ACCESS_TOKEN não está disponível neste deployment.'
    });
  }

  const me=await call('https://api.mercadolibre.com/users/me',token);
  const products=await call(
    'https://api.mercadolibre.com/products/search?status=active&site_id=MLB&q=Resident%20Evil%204',
    token
  );

  return res.status(200).json({
    configured:true,
    tokenCheck:me,
    productSearchCheck:products,
    note:'Nenhum token ou Client Secret é retornado por este endpoint.'
  });
};