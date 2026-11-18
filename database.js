/* CHEERS local data layer. Personal records remain on this device. */
const CheersDB = (() => {
 const KEY = "cheers-data-v1";
 const empty = () => ({products:[],tastings:[],version:1});
 function load(){try{return {...empty(),...JSON.parse(localStorage.getItem(KEY)||"{}")}}catch(e){return empty()}}
 let data=load();
 function save(){localStorage.setItem(KEY,JSON.stringify(data))}
 function allProducts(type){return data.products.filter(p=>!type||p.type===type).map(p=>({...p, tastings:data.tastings.filter(t=>t.productId===p.id)}))}
 function product(id){return allProducts().find(p=>p.id===id)||null}
 function addProduct(p){const item={...p,id:crypto.randomUUID(),createdAt:new Date().toISOString(),favorite:false};data.products.unshift(item);save();return item}
 function updateProduct(id,patch){data.products=data.products.map(p=>p.id===id?{...p,...patch}:p);save()}
 function removeProduct(id){data.products=data.products.filter(p=>p.id!==id);data.tastings=data.tastings.filter(t=>t.productId!==id);save()}
 function addTasting(t){const item={...t,id:crypto.randomUUID(),date:t.date||new Date().toISOString().slice(0,10)};data.tastings.unshift(item);save();return item}
 function removeTasting(id){data.tastings=data.tastings.filter(t=>t.id!==id);save()}
 function exportData(){return JSON.stringify({...data,exportedAt:new Date().toISOString()},null,2)}
 function importData(obj){if(!obj||!Array.isArray(obj.products)||!Array.isArray(obj.tastings))throw new Error("Dit back-upbestand is niet geldig.");data={...empty(),products:obj.products,tastings:obj.tastings};save()}
 function stats(){const ps=allProducts(),ts=data.tastings;const scores=ts.map(t=>Number(t.score)).filter(Number.isFinite);return {products:ps.length,beers:ps.filter(p=>p.type==="beer").length,wines:ps.filter(p=>p.type==="wine").length,tastings:ts.length,average:scores.length?(scores.reduce((a,b)=>a+b,0)/scores.length).toFixed(1):"—",favorites:ps.filter(p=>p.favorite).length}}
 return {allProducts,product,addProduct,updateProduct,removeProduct,addTasting,removeTasting,exportData,importData,stats};
})();