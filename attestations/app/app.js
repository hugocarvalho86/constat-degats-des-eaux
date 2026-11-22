/* Attestations faciles — Vitfix. Plusieurs documents, chacun décrit dans DOCS (étapes, PDF, mail). */
{
const CAP=window.Capacitor,NATIVE=!!(CAP&&CAP.isNativePlatform&&CAP.isNativePlatform());
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const clean1=s=>String(s||'').replace(/\s+/g,' ').trim();
const today=new Date().toISOString().slice(0,10);
const fr=v=>{if(!v)return'';const[y,m,dd]=v.split('-');return `${dd}/${m}/${y}`};
const YN=[['oui','Oui'],['non','Non']];
const INK=()=>PDFLib.rgb(0.04,0.16,0.45);

/* ================= Catalogue ================= */
const CATALOG=[
 {id:'temoin',t:'Attestation de témoin',s:'Cerfa 11527*03 — pour un procès, un litige, les prud’hommes…'},
 {id:'demeure',t:'Lettre de mise en demeure',s:'Impayé, dépôt de garantie, travaux, voisinage, livraison…'},
 {id:'dette',t:'Reconnaissance de dette',s:'Prêt entre particuliers, remboursement en une fois ou par mois'},
 {id:'animal',t:'Cession d’un chien ou d’un chat',s:'Vente ou don : l’attestation de cession signée par les deux'},
 {id:'heberg',t:'Attestation d’hébergement',s:'Quelqu’un habite chez vous : pour la mairie, la préfecture, la CAF…'},
 {id:'ast',t:'Autorisation de sortie du territoire',s:'Cerfa 15646 — enfant qui voyage sans ses parents',soon:1}
];
const ICON='<svg width="22" height="26" viewBox="0 0 100 120" aria-hidden="true"><path d="M14 4h52l22 22v86a4 4 0 0 1-4 4H14a4 4 0 0 1-4-4V8a4 4 0 0 1 4-4z" fill="none" stroke="currentColor" stroke-width="8"/><path d="M26 66l10 10 20-22" fill="none" stroke="currentColor" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/></svg>';

/* ================= Outils communs ================= */
function wrap(text,f,size,widths){
 const out=[];const W=i=>widths[Math.min(i,widths.length-1)];
 for(const para of String(text||'').split('\n')){
  const words=para.split(/\s+/).filter(Boolean);if(!words.length){out.push('');continue}
  let ln='';
  for(let wd of words){
   const t=ln?ln+' '+wd:wd;
   if(f.widthOfTextAtSize(t,size)<=W(out.length)){ln=t;continue}
   if(ln){out.push(ln);ln=''}
   while(f.widthOfTextAtSize(wd,size)>W(out.length)){let c=wd;while(c.length>1&&f.widthOfTextAtSize(c,size)>W(out.length))c=c.slice(0,-1);out.push(c);wd=wd.slice(c.length)}
   ln=wd;
  }
  if(ln)out.push(ln);
 }
 while(out.length&&out[out.length-1]==='')out.pop();
 return out;
}
const encoder=font=>s=>[...String(s||'')].map(ch=>{if(ch==='\n')return ch;try{font.encodeText(ch);return ch}catch(e){return ({'’':"'",'‘':"'",'œ':'oe','Œ':'OE','–':'-','—':'-','“':'"','”':'"','…':'...',' ':' ',' ':' ','€':'EUR'}[ch]||'')}}).join('');
function sigImg(key){try{return JSON.parse(d[key+'t']||'null')}catch(e){return null}}
const fullName=()=>[d.prenoms||d.prenom,d.nom&&d.nom.toUpperCase()].filter(Boolean).map(clean1).join(' ');

/* ================= Document 1 : attestation de témoin (Cerfa 11527*03) ================= */
const MENTION=['Est puni d’un an d’emprisonnement','et de 15 000 euros d’amende le fait','d’établir une attestation ou un certificat','faisant état de faits matériellement inexacts.'];
const PER_LINE=92;
const countLines=t=>t.split('\n').reduce((n,p)=>n+Math.max(1,Math.ceil(p.length/PER_LINE)),0);
function faitsText(){
 const head=[d.fdate&&`Le ${fr(d.fdate)}`,d.fheure&&`vers ${clean1(d.fheure)}`,d.flieu&&`à ${clean1(d.flieu)}`].filter(Boolean).join(' ');
 const body=String(d.recit||'').trim();
 return head?`${head}, j’ai personnellement constaté les faits suivants :\n${body}`:body;
}
function countTxt(){const n=countLines(faitsText());return `Environ ${n} ligne${n>1?'s':''} sur les 34 de la page des faits${n>34?' : une page de suite sera ajoutée':''}.`}

const TEMOIN={
 key:'attest_temoin_v1',title:'Attestation de témoin',sub:'Cerfa 11527*03 rempli automatiquement',
 init:x=>{if(!x.le)x.le=today;if(!x.pays)x.pays='France'},
 steps:[
  {t:'Avant de commencer',pre:()=>`<div class="note"><p><b>À quoi sert ce document ?</b> L’attestation de témoin sert à rapporter à un juge des faits que vous avez <b>vus ou entendus vous-même</b> : conflit de voisinage, accident, litige au travail, séparation…</p></div>
 <div class="note warn"><p><b>Avant de témoigner :</b></p><ul>
  <li>Racontez uniquement ce que vous avez constaté <b>personnellement</b>, pas ce qu’on vous a rapporté.</li>
  <li>Restez factuel : dates, lieux, paroles exactes, gestes. Évitez les opinions.</li>
  <li>Une fausse attestation est punie d’un an de prison et de 15 000 € d’amende (article 441-7 du code pénal).</li>
  <li>Une phrase doit être écrite <b>de votre main</b> : vous l’écrirez avec le doigt à l’étape 6.</li></ul></div>
 <div class="note"><p><b>Valeur de l’attestation :</b> la loi demande qu’elle soit écrite, datée et signée de la main de son auteur. Ces règles ne sont pas prescrites à peine de nullité : le PDF signé au doigt est en général accepté, mais le juge reste libre de sa valeur. Pour le plus de sécurité, l’appli propose aussi à la fin un <b>modèle à recopier à la main</b> sur le Cerfa papier.</p></div>`,fields:[]},
  {t:'Votre identité',fields:[
   {k:'civ',l:'Vous êtes',ty:'radio',o:[['mme','Madame'],['m','Monsieur']]},
   {k:'nom',l:'Nom de famille (nom de naissance)',ty:'text',ac:'family-name'},
   {k:'usage',l:'Nom d’usage',ty:'text',h:'Facultatif. Exemple : nom d’épouse ou d’époux.'},
   {k:'prenoms',l:'Prénoms',ty:'text',ac:'given-name',h:'Tous vos prénoms, comme sur votre pièce d’identité.'},
   {row:[{k:'naiss',l:'Date de naissance',ty:'date'},{k:'naisslieu',l:'Lieu de naissance',ty:'text'}]},
   {k:'prof',l:'Profession',ty:'text',h:'Si vous êtes sans emploi ou retraité(e), indiquez-le.'}]},
  {t:'Votre adresse',fields:[
   {k:'adr',l:'Adresse',ty:'text',ac:'address-line1'},
   {k:'adr2',l:'Complément d’adresse',ty:'text',ac:'address-line2',h:'Facultatif : bâtiment, étage, lieu-dit…'},
   {row:[{k:'cp',l:'Code postal',ty:'tel',ac:'postal-code'},{k:'ville',l:'Commune',ty:'text',ac:'address-level2'}]},
   {k:'pays',l:'Pays',ty:'text',ac:'country-name'}]},
  {t:'Votre lien avec les parties',fields:[
   {k:'lien',l:'Avez-vous un lien de parenté, d’alliance, de travail (subordination, collaboration) ou des intérêts communs avec l’une des personnes concernées par l’affaire ?',ty:'radio',o:YN,h:'Répondez honnêtement : un lien n’empêche pas de témoigner, mais il doit être déclaré.'},
   {k:'lienprec',l:'Précisez lequel',ty:'text',h:'Exemple : « collègue de travail de M. Martin », « sœur de Mme Durand ».',if:x=>x.lien==='oui',sub:1}]},
  {t:'Les faits',pre:()=>`<div class="note"><p>Écrivez à la 1<sup>re</sup> personne : « J’ai vu… », « J’ai entendu M. X dire : “…” ». Indiquez qui était présent et ce que chacun a fait. Une page de suite est ajoutée automatiquement si le texte est long.</p></div>`,
   post:()=>`<p class="count" id="cnt">${countTxt()}</p>`,live:['recit','fdate','fheure','flieu'],liveFn:()=>{const c=$('#cnt');if(c)c.textContent=countTxt()},fields:[
   {row:[{k:'fdate',l:'Date des faits',ty:'date'},{k:'fheure',l:'Heure (environ)',ty:'text',h:'Facultatif'}]},
   {k:'flieu',l:'Lieu des faits',ty:'text',h:'Adresse ou endroit précis.'},
   {k:'recit',l:'Ce que vous avez vu ou entendu vous-même',ty:'area',big:1}]},
  {t:'Mention écrite de votre main',pre:()=>`<div class="note"><p>Le Cerfa exige que cette phrase soit <b>écrite entièrement de votre main</b>. Recopiez chaque morceau avec le doigt dans le cadre en dessous (vous pouvez tourner le téléphone pour écrire plus à l’aise).</p></div>
 ${MENTION.map((m,i)=>`<div class="f"><p class="copy">${i+1}. ${esc(m)}</p><canvas class="pad" id="pad${i}"></canvas><div class="sigbar"><span>${d['m'+i]?'✓ Écrit':'Écrivez avec le doigt'}</span><button type="button" class="link" data-clear="m${i}">Effacer</button></div></div>`).join('')}`,
   pads:MENTION.map((_,i)=>['pad'+i,'m'+i]),recapRows:()=>[['Mention manuscrite',MENTION.every((_,k)=>d['m'+k+'t'])?'Écrite (4 morceaux)':'Incomplète']],fields:[]},
  {t:'Pièce d’identité',photos:1,pre:()=>photosHTML(),recapRows:()=>[['Pièce d’identité',phCount()]],fields:[]},
  {t:'Date et signature',fields:[{row:[{k:'faita',l:'Fait à',ty:'text'},{k:'le',l:'Le',ty:'date'}]}],
   post:()=>sigHTML('Signez avec le doigt, comme sur votre pièce d’identité'),pads:[['sigT','sig']],recapRows:()=>[['Signature',d.sigt?'Oui':'Non']]},
  {t:'Récapitulatif et envoi',recap:1,fields:[]}
 ],
 maxPh:2,phLabels:['Recto','Verso'],phIntro:()=>`<p>Le Cerfa demande de joindre <b>la copie d’un document officiel d’identité comportant votre signature</b> : carte d’identité, passeport, permis de conduire, titre de séjour.</p><p>Photographiez le recto (et le verso si la signature y figure). Les photos sont ajoutées à la fin du PDF.</p>`,
 phBtn:n=>n?'Photographier le verso':'Photographier la pièce d’identité',
 recapSkip:['recit'],
 recapMore:i=>i===4&&clean1(d.recit)?[['Récit',faitsText()]]:[],
 missing(){const m=[];
  if(!d.nom)m.push('nom de famille');if(!d.prenoms)m.push('prénoms');if(!d.naiss||!d.naisslieu)m.push('date et lieu de naissance');
  if(!d.adr||!d.ville)m.push('adresse');if(!d.lien)m.push('lien avec les parties');if(!clean1(d.recit))m.push('récit des faits');
  if(MENTION.some((_,i)=>!d['m'+i+'t']))m.push('mention manuscrite');if(!d.sigt)m.push('signature');if(!myPh().length)m.push('photo de la pièce d’identité');return m},
 missWarn:'Vous pouvez quand même produire le PDF, mais une attestation incomplète risque d’être écartée par le juge.',
 mailHint:'avocat, personne qui vous l’a demandée…',
 recapAfter:()=>`<div class="note" style="margin-top:16px"><p><b>Le plus sûr devant un juge :</b> imprimez le Cerfa vierge et recopiez-y à la main votre attestation. Ce modèle reprend tout ce que vous avez saisi, prêt à recopier.</p>
  <button type="button" class="btn" id="model" style="width:100%;margin-top:6px">Modèle à recopier à la main (PDF)</button></div>`,
 fname:model=>{const n=clean1(d.nom).split(' ').pop()||'';return `${model?'Modele_':''}Attestation_temoin${n?'_'+n.replace(/[^\wÀ-ÿ-]/g,''):''}_${d.le||today}.pdf`},
 mail(){const who=fullName();return {to:clean1(d.mailto),subj:`Attestation de témoin${who?' — '+who:''}`,
  body:`Bonjour,\n\nVeuillez trouver ci-joint mon attestation de témoin (Cerfa 11527*03)${d.fdate?` concernant les faits du ${fr(d.fdate)}`:''}, avec la copie de ma pièce d’identité.\n\nCordialement,\n${who}`}},
 async build(model){
  const {PDFDocument,StandardFonts,rgb,degrees}=PDFLib;
  const r=await fetch('cerfa_11527.pdf');if(!r.ok)throw new Error('formulaire introuvable');
  const doc=await PDFDocument.load(await r.arrayBuffer());
  const font=await doc.embedFont(StandardFonts.Helvetica),ital=await doc.embedFont(StandardFonts.HelveticaOblique),bold=await doc.embedFont(StandardFonts.HelveticaBold);
  const enc=encoder(font),one=s=>enc(clean1(s));
  const [p1,p2,p3]=doc.getPages();
  const put=(pg,str,x,y,x2=538,size=10)=>{let s=one(str);if(!s)return;while(size>6&&font.widthOfTextAtSize(s,size)>x2-x)size-=.25;while(s&&font.widthOfTextAtSize(s,size)>x2-x)s=s.slice(0,-1);pg.drawText(s,{x,y,size,font,color:INK()})};
  const cells=(pg,str,x0,cw,y,size=10)=>{[...String(str)].forEach((ch,i)=>{const w=font.widthOfTextAtSize(ch,size);pg.drawText(ch,{x:x0+cw*i+cw/2-w/2,y,size,font,color:INK()})})};
  const cross=(pg,cx,cy)=>{const k=3.3;pg.drawLine({start:{x:cx-k,y:cy-k},end:{x:cx+k,y:cy+k},thickness:1.3,color:INK()});pg.drawLine({start:{x:cx-k,y:cy+k},end:{x:cx+k,y:cy-k},thickness:1.3,color:INK()})};
  if(d.civ==='mme')cross(p1,48,597.5);if(d.civ==='m')cross(p1,189,597.5);
  put(p1,d.nom&&d.nom.toUpperCase(),262,576);put(p1,d.usage&&d.usage.toUpperCase(),335,556);put(p1,d.prenoms,120,536.5);
  if(d.naiss){const[y,m,dd]=d.naiss.split('-');cells(p1,dd+m+y,198.8,14.8,516)}
  put(p1,d.naisslieu,54,496);put(p1,d.prof,136,475.5);put(p1,d.adr,121,455.5);put(p1,d.adr2,172,436);
  if(d.cp)cells(p1,String(d.cp).replace(/\D/g,'').slice(0,5),113.3,14.55,415.5);
  put(p1,d.ville,266,415.5);put(p1,d.pays,76,395.5);
  if(d.lien==='oui')cross(p1,142.5,344);if(d.lien==='non')cross(p1,212.3,344);
  if(d.lien==='oui'){const L=wrap(one(d.lienprec),font,10,[538-163,538-44]);if(L[0])p1.drawText(L[0],{x:163,y:322,size:10,font,color:INK()});if(L[1])p1.drawText(L[1],{x:44,y:301.5,size:10,font,color:INK()})}
  const MB=[180.2,160,140.5,120.5,100.5,80.5,60.5],MX0=44,MX1=536;
  if(model){const txt=encoder(ital)('« '+MENTION.join(' ')+' »');wrap(txt,ital,10.5,[MX1-MX0]).forEach((l,i)=>p1.drawText(l,{x:MX0,y:MB[i],size:10.5,font:ital,color:rgb(.45,.45,.45)}))}
  else{
   const parts=MENTION.map((_,i)=>sigImg('m'+i)).filter(Boolean);
   if(parts.length){
    const ims=[];for(const p of parts)ims.push({p,im:await doc.embedPng(p.u)});
    const sc=Math.min(...ims.map(({p})=>52/p.ch));let line=0,x=MX0;
    for(const {p,im} of ims){
     const w=im.width*sc,h=im.height*sc;
     if(x+w>MX1&&x>MX0){line++;x=MX0}
     if(line>=MB.length)break;
     const ww=Math.min(w,MX1-MX0),k=ww/w,hh=h*k;
     p1.drawImage(im,{x,y:MB[line]-2-(p.bot-75/110)*p.ch*sc*k,width:ww,height:hh});x+=ww+6;
    }
   }
  }
  const LW=536-44,LS=20,L0=750.5,NL=34;
  const lines=wrap(enc(faitsText()),font,10,[LW]);
  const fill=(pg,arr)=>arr.forEach((l,i)=>pg.drawText(l,{x:44,y:L0-i*LS,size:10,font,color:INK()}));
  fill(p2,lines.slice(0,NL));
  let rest=lines.slice(NL),pos=2,num=1;
  while(rest.length){const [cp]=await doc.copyPages(doc,[1]);doc.insertPage(pos,cp);
   cp.drawRectangle({x:40,y:752,width:500,height:40,color:rgb(1,1,1)});
   cp.drawText(enc(`Suite de la relation des faits (${++num})`),{x:44,y:775,size:11,font:bold,color:INK()});
   fill(cp,rest.slice(0,NL));rest=rest.slice(NL);pos++}
  put(p3,fullName(),210,641);put(p3,d.faita,85,596,288);
  if(d.le){const[y,m,dd]=d.le.split('-');cells(p3,dd+m+y,309.8,12.2,596)}
  if(!model){const s=sigImg('sig');if(s){const im=await doc.embedPng(s.u),k=Math.min(200/im.width,70/im.height);p3.drawImage(im,{x:60,y:560-im.height*k,width:im.width*k,height:im.height*k})}}
  const photos=myPh();if(!model&&photos.length){
   const W=595.28,H=841.89,M=40,bw=W-2*M,bh=330;const pg=doc.addPage([W,H]);
   pg.drawText(enc('Pièce jointe : justificatif d’identité du témoin'),{x:M,y:H-50,size:12,font:bold,color:INK()});
   pg.drawText(one(fullName()),{x:M,y:H-65,size:9,font,color:INK()});
   for(let j=0;j<photos.length;j++){const p=photos[j],im=await doc.embedJpg(new Uint8Array(await p.blob.arrayBuffer()));
    const top=H-85-j*360,k=Math.min(bw/im.width,bh/im.height),w=im.width*k,h=im.height*k;
    pg.drawImage(im,{x:M+(bw-w)/2,y:top-bh+(bh-h)/2,width:w,height:h});pg.drawText(j?'Verso':'Recto',{x:M,y:top-bh-13,size:9,font,color:INK()})}
  }
  if(model)for(const pg of doc.getPages())pg.drawText(encoder(bold)('MODÈLE À RECOPIER À LA MAIN'),{x:95,y:250,size:36,font:bold,color:rgb(.85,.2,.2),opacity:.18,rotate:degrees(35)});
  doc.setTitle(model?'Attestation de témoin - modèle à recopier':'Attestation de témoin (Cerfa 11527*03)');
  return finish(doc);
 }
};

/* ================= Document 2 : lettre de mise en demeure ================= */
const TYPES=[['argent','Une somme d’argent impayée'],['depot','Un dépôt de garantie non rendu'],['travaux','Des travaux non faits ou mal faits'],['voisin','Un trouble de voisinage'],['livraison','Une commande non livrée'],['autre','Autre chose']];
const NUIS=[['bruit','Bruit'],['odeurs','Odeurs ou fumées'],['animaux','Animaux'],['vegetation','Arbres, haies, végétation'],['eau','Infiltrations, fuites'],['autre','Autre']];
const eLE=()=>d.civ==='mme'?'e':'';
const money=v=>{const s=clean1(v).replace(/\s*€$|\s*euros?$/i,'');return s?`${s} €`:''};
function letter(){
 const L=[],delai=d.delai||'15',ty=d.type;
 const del=`dans un délai de ${delai} jours à compter de la réception de la présente lettre`;
 let objet='',demande='',suite='';
 if(ty==='argent'){
  objet=`paiement de la somme de ${money(d.montant)||'…'}`;
  L.push(`Je vous rappelle que vous restez redevable envers moi de la somme de ${money(d.montant)||'…'}${d.motif?`, au titre de ${clean1(d.motif)}`:''}${d.echeance?`, exigible depuis le ${fr(d.echeance)}`:''}.`);
  if(clean1(d.recit))L.push(clean1(d.recit));
  L.push(`Malgré mes relances, cette somme ne m’a toujours pas été réglée.`);
  demande=`Je vous mets donc en demeure de me régler la somme de ${money(d.montant)||'…'} ${del}.`;
  suite=`Je vous rappelle que la présente mise en demeure fait courir les intérêts au taux légal sur cette somme (article 1344-1 du code civil).`;
 }else if(ty==='depot'){
  objet='restitution du dépôt de garantie';
  L.push(`J’ai été locataire du logement situé ${clean1(d.bail)||'…'}, que j’ai quitté${eLE()} le ${fr(d.sortie)||'…'}, date de l’état des lieux de sortie et de la remise des clés. Je vous avais versé un dépôt de garantie de ${money(d.depot)||'…'}.`);
  L.push(d.edl==='oui'?`L’état des lieux de sortie étant conforme à l’état des lieux d’entrée, vous deviez me restituer ce dépôt dans un délai d’un mois (article 22 de la loi n° 89-462 du 6 juillet 1989).`:`Le dépôt de garantie devait m’être restitué dans un délai de deux mois, déduction faite des seules sommes dûment justifiées (article 22 de la loi n° 89-462 du 6 juillet 1989).`);
  if(clean1(d.recit))L.push(clean1(d.recit));
  L.push(`À ce jour, ce délai est dépassé et je n’ai rien reçu.`);
  demande=`Je vous mets donc en demeure de me restituer la somme de ${money(d.depot)||'…'} ${del}.`;
  suite=`Je vous rappelle qu’à défaut de restitution dans le délai légal, le dépôt de garantie restant dû est majoré d’une somme égale à 10 % du loyer mensuel hors charges${d.loyer?` (soit ${money(d.loyer)} de loyer)`:''} pour chaque mois de retard commencé (même article).`;
 }else if(ty==='travaux'){
  objet='exécution des travaux convenus';
  L.push(`Le ${fr(d.devisdate)||'…'}, je vous ai confié la réalisation des travaux suivants : ${clean1(d.nature)||'…'}${d.paye?`, pour lesquels je vous ai déjà versé ${money(d.paye)}`:''}.`);
  L.push(`Or, ${clean1(d.probleme)||'ces travaux ne sont pas terminés'}.`);
  if(clean1(d.recit))L.push(clean1(d.recit));
  demande=`Je vous mets donc en demeure de terminer les travaux et de reprendre les défauts constatés, conformément à nos accords, ${del}.`;
  suite=`À défaut, je me réserve le droit de faire terminer ou reprendre les travaux par une autre entreprise à vos frais et de demander l’indemnisation de mon préjudice.`;
 }else if(ty==='voisin'){
  const n=(NUIS.find(x=>x[0]===d.nuis)||[,'nuisances'])[1].toLowerCase();
  objet=`cessation d’un trouble anormal de voisinage (${n})`;
  L.push(`Depuis ${clean1(d.depuis)||'plusieurs semaines'}, je subis des nuisances (${n}) provenant de votre logement ou de votre propriété${d.adrnuis?`, situé ${clean1(d.adrnuis)}`:''}.`);
  if(clean1(d.recit))L.push(clean1(d.recit));
  L.push(`Ces nuisances excèdent les inconvénients normaux du voisinage. Nul ne doit causer à autrui un trouble anormal de voisinage (article 1253 du code civil).`);
  demande=`Je vous mets donc en demeure de faire cesser ces nuisances ${del}.`;
  suite=`À défaut, je saisirai le conciliateur de justice puis, si nécessaire, le tribunal compétent afin d’obtenir la cessation du trouble et la réparation de mon préjudice.`;
 }else if(ty==='livraison'){
  objet='livraison de ma commande';
  L.push(`Le ${fr(d.cmddate)||'…'}, j’ai passé commande auprès de vous de : ${clean1(d.cmd)||'…'}${d.prix?`, pour un prix de ${money(d.prix)}`:''}, que j’ai réglé.`);
  L.push(`La livraison devait intervenir ${d.livdate?`au plus tard le ${fr(d.livdate)}`:'dans un délai de 30 jours'}. Je n’ai toujours rien reçu.`);
  if(clean1(d.recit))L.push(clean1(d.recit));
  demande=`Conformément à l’article L. 216-6 du code de la consommation, je vous mets en demeure d’effectuer la livraison ${del}.`;
  suite=`À défaut, je considérerai le contrat comme résolu et vous devrez me rembourser l’intégralité des sommes versées au plus tard dans les quatorze jours (article L. 216-7 du même code).`;
 }else{
  objet=clean1(d.objetlibre)||'…';
  if(clean1(d.recit))L.push(clean1(d.recit));
  demande=`Je vous mets donc en demeure de ${clean1(d.demlibre)||'…'} ${del}.`;
 }
 const fin=`Sans réponse satisfaisante de votre part dans ce délai, je me verrai contraint${eLE()} d’engager toute procédure utile, après la tentative de résolution amiable prévue par la loi (conciliateur de justice), pour faire valoir mes droits, sans autre avis de ma part.`;
 return {objet:`Mise en demeure — ${objet}`,paras:[...L,demande,suite,fin,`La présente lettre vaut mise en demeure au sens de l’article 1344 du code civil. Je vous prie de recevoir, ${d.dciv==='m'?'Monsieur':d.dciv==='mme'?'Madame':'Madame, Monsieur'}, mes salutations distinguées.`].filter(Boolean)};
}
const DEMEURE={
 key:'attest_demeure_v1',title:'Mise en demeure',sub:'Lettre prête à envoyer en recommandé',
 init:x=>{if(!x.le)x.le=today;if(!x.delai)x.delai='15'},
 steps:[
  {t:'Avant de commencer',pre:()=>`<div class="note"><p><b>À quoi sert une mise en demeure ?</b> C’est la dernière demande avant d’aller en justice : vous rappelez les faits, vous exigez quelque chose dans un délai précis, et vous annoncez les suites. Elle est souvent indispensable avant de saisir un juge, et elle suffit parfois à régler le problème.</p></div>
 <div class="note warn"><ul>
  <li>Restez courtois et factuel : la lettre peut être lue par un juge.</li>
  <li><b>Envoyez-la en lettre recommandée avec accusé de réception</b> (à La Poste ou en ligne) et gardez une copie : c’est la preuve de sa date.</li>
  <li>Cette appli propose un modèle courant. Elle ne remplace pas le conseil d’un avocat ou d’une association de consommateurs.</li></ul></div>`,fields:[]},
  {t:'Pour quel problème ?',fields:[{k:'type',l:'Vous réclamez…',ty:'radio',o:TYPES}]},
  {t:'Vous',fields:[
   {k:'civ',l:'Vous êtes',ty:'radio',o:[['mme','Madame'],['m','Monsieur']]},
   {row:[{k:'prenom',l:'Prénom',ty:'text',ac:'given-name'},{k:'nom',l:'Nom',ty:'text',ac:'family-name'}]},
   {k:'adr',l:'Adresse',ty:'text',ac:'address-line1'},
   {row:[{k:'cp',l:'Code postal',ty:'tel',ac:'postal-code'},{k:'ville',l:'Commune',ty:'text',ac:'address-level2'}]},
   {row:[{k:'tel',l:'Téléphone',ty:'tel',ac:'tel',h:'Facultatif'},{k:'mail',l:'Mail',ty:'email',ac:'email',h:'Facultatif'}]}]},
  {t:'Le destinataire',fields:[
   {k:'dciv',l:'Le destinataire est',ty:'radio',o:[['mme','Une femme'],['m','Un homme'],['soc','Une société']]},
   {k:'dnom',l:'Nom (ou nom de la société)',ty:'text'},
   {k:'dadr',l:'Adresse',ty:'text'},
   {row:[{k:'dcp',l:'Code postal',ty:'tel'},{k:'dville',l:'Commune',ty:'text'}]},
   {k:'mailto',l:'Son mail',ty:'email',h:'Facultatif : pour lui envoyer aussi une copie par mail.'}]},
  {t:'Les faits',pre:()=>d.type?'':`<div class="note warn"><p>Choisissez d’abord le type de problème à l’étape 2.</p></div>`,fields:[
   {k:'montant',l:'Montant dû (€)',ty:'text',if:x=>x.type==='argent'},
   {k:'motif',l:'À quel titre ?',ty:'text',h:'Exemple : « la facture n° 125 du 3 mars », « le prêt que je vous ai consenti le 1er juin ».',if:x=>x.type==='argent'},
   {k:'echeance',l:'Date à laquelle il fallait payer',ty:'date',if:x=>x.type==='argent'},
   {k:'bail',l:'Adresse du logement loué',ty:'text',if:x=>x.type==='depot'},
   {row:[{k:'sortie',l:'Date de sortie (remise des clés)',ty:'date'},{k:'depot',l:'Dépôt de garantie (€)',ty:'text'}],if:x=>x.type==='depot'},
   {k:'loyer',l:'Loyer mensuel hors charges (€)',ty:'text',h:'Sert à rappeler la majoration de 10 % par mois de retard.',if:x=>x.type==='depot'},
   {k:'edl',l:'L’état des lieux de sortie était-il identique à celui d’entrée ?',ty:'radio',o:YN,if:x=>x.type==='depot'},
   {k:'nature',l:'Quels travaux ?',ty:'text',h:'Exemple : « la rénovation de la salle de bain ».',if:x=>x.type==='travaux'},
   {row:[{k:'devisdate',l:'Date du devis ou de l’accord',ty:'date'},{k:'paye',l:'Déjà payé (€)',ty:'text',h:'Facultatif'}],if:x=>x.type==='travaux'},
   {k:'probleme',l:'Ce qui ne va pas',ty:'area',h:'Exemple : « le carrelage n’est pas posé et la douche fuit depuis le 10 mai ».',if:x=>x.type==='travaux'},
   {k:'nuis',l:'Type de nuisance',ty:'radio',o:NUIS,if:x=>x.type==='voisin'},
   {row:[{k:'depuis',l:'Depuis quand ?',ty:'text',h:'Exemple : « le mois de septembre »'},{k:'adrnuis',l:'Adresse du voisin',ty:'text',h:'Facultatif'}],if:x=>x.type==='voisin'},
   {k:'cmd',l:'Ce que vous avez commandé',ty:'text',h:'Avec le numéro de commande si vous l’avez.',if:x=>x.type==='livraison'},
   {row:[{k:'cmddate',l:'Date de commande',ty:'date'},{k:'prix',l:'Prix payé (€)',ty:'text'}],if:x=>x.type==='livraison'},
   {k:'livdate',l:'Date de livraison promise',ty:'date',h:'Facultatif : sans date promise, le délai légal est de 30 jours.',if:x=>x.type==='livraison'},
   {k:'objetlibre',l:'Objet de la lettre',ty:'text',h:'Exemple : « restitution de mon matériel ».',if:x=>x.type==='autre'},
   {k:'demlibre',l:'Ce que vous exigez',ty:'text',h:'Complète la phrase « Je vous mets en demeure de… ». Exemple : « me rendre la perceuse prêtée le 2 avril ».',if:x=>x.type==='autre'},
   {k:'recit',l:'Précisions sur les faits',ty:'area',h:'Facultatif : relances déjà faites, dates, échanges. Une ou deux phrases suffisent.'}]},
  {t:'Délai',fields:[{k:'delai',l:'Délai laissé au destinataire',ty:'radio',o:[['8','8 jours'],['15','15 jours'],['30','30 jours']],h:'15 jours est le plus courant. Un délai trop court peut être jugé déraisonnable.'}]},
  {t:'Date et signature',fields:[{row:[{k:'faita',l:'Fait à',ty:'text'},{k:'le',l:'Le',ty:'date'}]}],post:()=>sigHTML('Signez avec le doigt'),pads:[['sigT','sig']],recapRows:()=>[['Signature',d.sigt?'Oui':'Non']]},
  {t:'Votre lettre',recap:1,fields:[]}
 ],
 recapSkip:[],
 recapMore:()=>[],
 recapBefore:()=>{const l=letter();return `<div class="note"><p><b>Aperçu de la lettre</b></p><p><b>Objet : ${esc(l.objet)}</b></p>${l.paras.map(p=>`<p>${esc(p)}</p>`).join('')}<p style="font-size:13px;color:var(--mute)">Pour modifier le texte, revenez aux étapes précédentes.</p></div>`},
 missing(){const m=[];if(!d.type)m.push('type de problème');if(!d.nom||!d.prenom)m.push('vos nom et prénom');if(!d.adr||!d.ville)m.push('votre adresse');
  if(!d.dnom||!d.dadr)m.push('destinataire');if(!d.sigt)m.push('signature');return m},
 missWarn:'Vous pouvez quand même produire le PDF, mais complétez ces informations avant de l’envoyer.',
 mailHint:'adresse mail du destinataire',
 recapAfter:()=>`<div class="note" style="margin-top:16px"><p><b>Pour que la mise en demeure compte :</b> imprimez le PDF et envoyez-le en <b>lettre recommandée avec accusé de réception</b> (à La Poste, ou en ligne sur le site de La Poste). Le mail seul ne prouve pas la réception.</p></div>`,
 fname:()=>{const n=clean1(d.dnom).replace(/[^\wÀ-ÿ -]/g,'').replace(/\s+/g,'_').slice(0,30);return `Mise_en_demeure${n?'_'+n:''}_${d.le||today}.pdf`},
 mail(){const l=letter(),who=fullName();return {to:clean1(d.mailto),subj:l.objet,body:`${d.dciv==='m'?'Monsieur':d.dciv==='mme'?'Madame':'Madame, Monsieur'},\n\nVeuillez trouver ci-joint une lettre de mise en demeure, qui vous est également adressée par courrier recommandé avec accusé de réception.\n\n${who}`}},
 async build(){
  const {PDFDocument,StandardFonts}=PDFLib;
  const doc=await PDFDocument.create();
  const font=await doc.embedFont(StandardFonts.Helvetica),bold=await doc.embedFont(StandardFonts.HelveticaBold);
  const enc=encoder(font),W=595.28,H=841.89,M=62,TW=W-2*M,SZ=10.8,LH=15.2;
  let pg=doc.addPage([W,H]),y=H-60;
  const newPage=()=>{pg=doc.addPage([W,H]);y=H-60};
  const line=(s,f=font,x=M,size=SZ)=>{if(y<70)newPage();pg.drawText(s,{x,y,size,font:f,color:PDFLib.rgb(.08,.08,.1)});y-=LH};
  const block=(arr,x=M)=>arr.filter(Boolean).forEach(s=>line(enc(clean1(s)),font,x));
  // Expéditeur à gauche, destinataire à droite
  block([fullName(),d.adr,[d.cp,d.ville].filter(Boolean).join(' '),d.tel&&'Tél. : '+d.tel,d.mail]);
  y-=8;
  block([d.dnom,d.dadr,[d.dcp,d.dville].filter(Boolean).join(' ')],W/2+10);
  y-=10;
  line(enc(`${clean1(d.faita)||clean1(d.ville)||'…'}, le ${fr(d.le)||'…'}`),font,W/2+10);
  y-=8;
  line(enc('Lettre recommandée avec accusé de réception'),bold);
  const l=letter();
  for(const s of wrap(enc('Objet : '+l.objet),bold,SZ,[TW]))line(s,bold);
  y-=10;
  line(enc(d.dciv==='m'?'Monsieur,':d.dciv==='mme'?'Madame,':'Madame, Monsieur,'));y-=6;
  for(const p of l.paras){for(const s of wrap(enc(p),font,SZ,[TW]))line(s);y-=7}
  y-=6;if(y<150)newPage();
  const sx=W/2+10;
  const s=sigImg('sig');
  if(s){const im=await doc.embedPng(s.u),k=Math.min(170/im.width,60/im.height);pg.drawImage(im,{x:sx,y:y-im.height*k,width:im.width*k,height:im.height*k});y-=im.height*k+16}
  line(enc(fullName()),font,sx);
  doc.setTitle(l.objet);
  return finish(doc);
 }
};

/* ================= Outils pour les documents créés de zéro ================= */
const CIV=[['mme','Madame'],['m','Monsieur']];
function personFields(p,{birth=true,addr=true}={}){return [
 {k:p+'civ',l:'Civilité',ty:'radio',o:CIV},
 {row:[{k:p+'prenom',l:'Prénom',ty:'text'},{k:p+'nom',l:'Nom',ty:'text'}]},
 ...(birth?[{row:[{k:p+'naiss',l:'Date de naissance',ty:'date'},{k:p+'naisslieu',l:'Lieu de naissance',ty:'text'}]}]:[]),
 ...(addr?[{k:p+'adr',l:'Adresse',ty:'text'},{row:[{k:p+'cp',l:'Code postal',ty:'tel'},{k:p+'ville',l:'Commune',ty:'text'}]}]:[])]}
const pName=p=>[d[p+'prenom'],d[p+'nom']&&d[p+'nom'].toUpperCase()].filter(Boolean).map(clean1).join(' ');
const pCiv=p=>d[p+'civ']==='mme'?'Madame':d[p+'civ']==='m'?'Monsieur':'';
const pE=p=>d[p+'civ']==='mme'?'e':'';
const pAddr=p=>[clean1(d[p+'adr']),[d[p+'cp'],d[p+'ville']].map(clean1).filter(Boolean).join(' ')].filter(Boolean).join(', ');
function pText(p,{birth=true,addr=true}={}){
 const who=[pCiv(p),pName(p)].filter(Boolean).join(' ')||'…';
 const b=birth&&(d[p+'naiss']||d[p+'naisslieu'])?`né${pE(p)}${d[p+'naiss']?' le '+fr(d[p+'naiss']):''}${d[p+'naisslieu']?' à '+clean1(d[p+'naisslieu']):''}`:'';
 const a=addr&&pAddr(p)?'demeurant '+pAddr(p):'';
 return [who,b,a].filter(Boolean).join(', ');
}
const num=v=>{const n=parseFloat(String(v||'').replace(/[\s  €]/g,'').replace(/euros?/i,'').replace(',','.'));return isFinite(n)?n:NaN};
const eur=n=>isFinite(n)?n.toLocaleString('fr-FR',{minimumFractionDigits:Math.round(n*100)%100?2:0,maximumFractionDigits:2}).replace(/[  ]/g,' ')+' €':'…';
/* Nombre en toutes lettres (orthographe traditionnelle) */
const U19=['zéro','un','deux','trois','quatre','cinq','six','sept','huit','neuf','dix','onze','douze','treize','quatorze','quinze','seize','dix-sept','dix-huit','dix-neuf'];
const DIZ=['','dix','vingt','trente','quarante','cinquante','soixante','soixante','quatre-vingt','quatre-vingt'];
function w99(n){if(n<20)return U19[n];const t=Math.floor(n/10),u=n%10;
 if(t===7||t===9)return DIZ[t]+(t===7&&u===1?' et ':'-')+U19[10+u];
 if(u===0)return DIZ[t]+(t===8?'s':'');
 if(u===1&&t!==8)return DIZ[t]+' et un';
 return DIZ[t]+'-'+U19[u]}
function w999(n){const c=Math.floor(n/100),r=n%100;let s='';if(c)s=c>1?U19[c]+' cent'+(r?'':'s'):'cent';if(r)s+=(s?' ':'')+w99(r);return s}
function words(n){if(!n)return 'zéro';const g=Math.floor(n/1e9),m=Math.floor(n%1e9/1e6),k=Math.floor(n%1e6/1000),r=n%1000,s=[];
 if(g)s.push(w999(g)+' milliard'+(g>1?'s':''));if(m)s.push(w999(m)+' million'+(m>1?'s':''));
 if(k)s.push(k===1?'mille':w999(k).replace(/(cent|vingt)s$/,'$1')+' mille');if(r)s.push(w999(r));return s.join(' ')}
function enLettres(v){if(!isFinite(v)||v<0)return '';const i=Math.floor(v+1e-9),c=Math.round((v-i)*100);
 let s=i||!c?`${words(i)} ${i>=1e6&&i%1e6===0?'d’euros':'euro'+(i>1?'s':'')}`:'';
 if(c)s+=(s?' et ':'')+words(c)+' centime'+(c>1?'s':'');return s}
const handPad=(id,key,copy)=>`<div class="f"><p class="copy">${esc(copy)}</p><canvas class="pad" id="${id}"></canvas><div class="sigbar"><span>${d[key]?'✓ Écrit':'Écrivez avec le doigt'}</span><button type="button" class="link" data-clear="${key}">Effacer</button></div></div>`;
const padBox=(id,key,label,hint)=>`<div class="f"><span class="lab">${esc(label)}</span><canvas class="sig" id="${id}"></canvas><div class="sigbar"><span>${d[key]?'✓ Signé':esc(hint)}</span><button type="button" class="link" data-clear="${key}">Effacer</button></div></div>`;
const preview=(title,paras)=>`<div class="note"><p><b>Aperçu du document</b></p><p><b>${esc(title)}</b></p>${paras.filter(Boolean).map(p=>`<p>${esc(p)}</p>`).join('')}<p style="font-size:13px;color:var(--mute)">Pour modifier le texte, revenez aux étapes précédentes.</p></div>`;
const fnPart=s=>clean1(s).replace(/[^\wÀ-ÿ -]/g,'').replace(/\s+/g,'_').slice(0,30);

/* Document « papier » créé de zéro : titre, blocs, mentions manuscrites, signatures, annexe photos */
async function paperPDF(o){
 const {PDFDocument,StandardFonts,rgb}=PDFLib;
 const pdf=await PDFDocument.create();
 const font=await pdf.embedFont(StandardFonts.Helvetica),bold=await pdf.embedFont(StandardFonts.HelveticaBold);
 const enc=encoder(font),W=595.28,H=841.89,M=62,TW=W-2*M,SZ=o.sz||10.6,LH=SZ*1.4,C=rgb(.08,.08,.1),GR=rgb(.32,.35,.38);
 let pg=pdf.addPage([W,H]),y=H-66;
 const need=h=>{if(y-h<56){pg=pdf.addPage([W,H]);y=H-66}};
 const para=(s,f=font,x=M,w=TW)=>{for(const l of wrap(enc(clean1(s)),f,SZ,[w])){need(LH);pg.drawText(l,{x,y,size:SZ,font:f,color:C});y-=LH}};
 const center=(s,f,size,col=C)=>{const t=enc(clean1(s));need(size+6);pg.drawText(t,{x:(W-f.widthOfTextAtSize(t,size))/2,y,size,font:f,color:col});y-=size+7};
 const img=async key=>{const p=sigImg(key);return p?await pdf.embedPng(p.u):null};
 center(o.title,bold,15);if(o.sub)center(o.sub,font,9.2,GR);y-=12;
 for(const b of o.blocks){
  if(!b)continue;
  if(b.h){y-=4;need(LH*3);para(b.h,bold);y-=3}
  else if(b.p){para(b.p);y-=6}
  else if(b.kv){for(const [k,v] of b.kv){if(!clean1(v))continue;const L=wrap(enc(clean1(v)),font,SZ,[TW-150]);need(LH*L.length);
    pg.drawText(enc(k),{x:M,y,size:SZ-.8,font:bold,color:GR});L.forEach((l,i)=>pg.drawText(l,{x:M+150,y:y-i*LH,size:SZ,font,color:C}));y-=LH*L.length+2}y-=6}
  else if(b.hand){if(b.cap)para(b.cap,bold);y-=2;
   for(const k of b.hand){const im=await img(k);if(!im){para('(mention non écrite)');continue}
    const s=Math.min(TW/im.width,36/im.height),w=im.width*s,h=im.height*s;need(h+8);pg.drawImage(im,{x:M,y:y-h+LH-2,width:w,height:h});y-=h+6}y-=8}
 }
 const S=o.sigs||[];
 if(S.length){y-=4;need(118);const cw=TW/S.length,top=y;
  for(let i=0;i<S.length;i++){const s=S[i],x=M+i*cw;
   pg.drawText(enc(s.label),{x,y:top,size:SZ-.6,font:bold,color:C});
   const im=await img(s.key);if(im){const k=Math.min((cw-24)/im.width,62/im.height);pg.drawImage(im,{x,y:top-10-im.height*k,width:im.width*k,height:im.height*k})}
   if(s.name)pg.drawText(enc(clean1(s.name)),{x,y:top-88,size:SZ-.6,font,color:C})}
  y=top-104}
 const ph=o.ph||[];
 for(let j=0;j<ph.length;j++){
  if(j%2===0){pg=pdf.addPage([W,H]);for(const [i,l] of wrap(enc(o.annexTitle||'Pièces jointes'),bold,12,[W-80]).entries())pg.drawText(l,{x:40,y:H-50-i*15,size:12,font:bold,color:C})}
  const p=ph[j],im=await pdf.embedJpg(new Uint8Array(await p.blob.arrayBuffer()));
  const top=H-85-(j%2)*370,bw=W-80,bh=330,k=Math.min(bw/im.width,bh/im.height),w=im.width*k,h=im.height*k;
  pg.drawImage(im,{x:40+(bw-w)/2,y:top-bh+(bh-h)/2,width:w,height:h});
  pg.drawText(enc((o.phLabels||[])[j]||'Pièce jointe '+(j+1)),{x:40,y:top-bh-13,size:9,font,color:C})}
 pdf.setTitle(enc(o.docTitle||o.title));
 return finish(pdf);
}
const sigStep=()=>({t:'Date et signature',fields:[{row:[{k:'faita',l:'Fait à',ty:'text'},{k:'le',l:'Le',ty:'date'}]}],post:()=>sigHTML('Signez avec le doigt'),pads:[['sigT','sig']],recapRows:()=>[['Signature',d.sigt?'Oui':'Non']]});
const faitLe=()=>`Fait à ${clean1(d.faita)||'…'}, le ${fr(d.le)||'…'}`;

/* ================= Document 3 : reconnaissance de dette ================= */
const MODES={virement:'par virement bancaire',cheque:'par chèque',especes:'en espèces'};
function detteCalc(){
 const m=num(d.montant),n=Math.max(1,parseInt(d.nb)||0);
 const mens=num(d.mens)>0?num(d.mens):Math.round(m/n*100)/100;
 const last=Math.round((m-mens*(n-1))*100)/100;
 return {m,n,mens,last};
}
const lettresTxt=()=>{const m=num(d.montant);return isFinite(m)&&m>0?`En lettres : ${enLettres(m)}`:'Indiquez le montant en chiffres, par exemple 1 500 ou 1 500,50.'};
function detteParas(){
 const {m,n,mens,last}=detteCalc(),L=[];
 L.push(`Je soussigné${pE('a_')} ${pText('a_')},`);
 L.push(`reconnais devoir à ${pText('b_')},`);
 L.push(`la somme de ${eur(m)} (${enLettres(m)||'…'}).`);
 if(d.motif==='pret')L.push(`Cette somme m’a été prêtée${d.pdate?' le '+fr(d.pdate):''}${MODES[d.pmode]?' '+MODES[d.pmode]:''}.`);
 else if(clean1(d.motiftxt))L.push(`Cette somme est due au titre de ${clean1(d.motiftxt)}.`);
 if(d.remb==='echeancier'){
  L.push(`Je m’engage à la rembourser en ${n} mensualité${n>1?'s':''} de ${eur(mens)}${Math.abs(last-mens)>.004&&n>1?` (la dernière étant de ${eur(last)})`:''}, payable${n>1?'s':''} le ${clean1(d.jour)||'…'} de chaque mois à compter du ${fr(d.rdebut)||'…'}.`);
  L.push(`À défaut de paiement d’une seule mensualité à son échéance, et huit jours après une mise en demeure restée sans effet, la totalité de la somme restant due deviendra immédiatement exigible si bon semble au créancier.`);
 }else L.push(`Je m’engage à la rembourser en une seule fois, au plus tard le ${fr(d.rdate)||'…'}.`);
 L.push(d.interets==='oui'?`Cette somme porte intérêts au taux de ${clean1(d.taux)||'…'} % par an.`:`Cette somme ne porte pas intérêts.`);
 L.push(`${faitLe()}, en un exemplaire original remis au créancier.`);
 return L;
}
const DETTE={
 key:'attest_dette_v1',title:'Reconnaissance de dette',sub:'Signée par la personne qui doit l’argent',
 init:x=>{if(!x.le)x.le=today;if(!x.remb)x.remb='unique';if(!x.interets)x.interets='non';if(!x.motif)x.motif='pret'},
 steps:[
  {t:'Avant de commencer',pre:()=>`<div class="note"><p><b>À quoi sert ce document ?</b> La reconnaissance de dette prouve qu’une personne doit une somme d’argent à une autre (prêt entre amis ou en famille, reste à payer…). Elle permet de réclamer la somme plus facilement, y compris devant un juge.</p></div>
 <div class="note warn"><ul>
  <li>Elle est remplie et signée par <b>la personne qui doit l’argent</b> (le débiteur). L’original est remis à la personne qui a prêté (le créancier).</li>
  <li>La loi demande que le débiteur écrive <b>lui-même la somme en chiffres et en lettres</b> (article 1376 du code civil) : vous l’écrirez avec le doigt à l’étape 6. Pour le plus de sécurité, vous pouvez aussi la recopier à la main sur le document imprimé.</li>
  <li>Un prêt de plus de <b>5 000 €</b> doit être déclaré aux impôts par l’emprunteur (formulaire 2062, en ligne sur impots.gouv.fr).</li>
  <li>Préférez un virement aux espèces : il laisse une trace de la remise de l’argent.</li></ul></div>`,fields:[]},
  {t:'Vous, qui devez l’argent',fields:personFields('a_')},
  {t:'La personne à qui vous devez',fields:personFields('b_')},
  {t:'La somme',fields:[
   {k:'montant',l:'Montant dû (€)',ty:'text',h:'Exemple : 1 500 ou 1 500,50'},
   {k:'motif',l:'D’où vient cette dette ?',ty:'radio',o:[['pret','D’un prêt'],['autre','D’autre chose']]},
   {k:'pdate',l:'Date du prêt',ty:'date',if:x=>x.motif==='pret'},
   {k:'pmode',l:'Comment l’argent a été remis',ty:'radio',o:[['virement','Virement'],['cheque','Chèque'],['especes','Espèces']],if:x=>x.motif==='pret'},
   {k:'motiftxt',l:'À quel titre ?',ty:'text',h:'Exemple : « le solde du prix de la voiture achetée le 3 mars ».',if:x=>x.motif==='autre'}],
   post:()=>`<p class="count" id="lettres">${esc(lettresTxt())}</p>`,live:['montant'],liveFn:()=>{const c=$('#lettres');if(c)c.textContent=lettresTxt()}},
  {t:'Remboursement',fields:[
   {k:'remb',l:'Vous rembourserez…',ty:'radio',o:[['unique','En une seule fois'],['echeancier','En plusieurs fois']]},
   {k:'rdate',l:'Au plus tard le',ty:'date',if:x=>x.remb!=='echeancier'},
   {row:[{k:'nb',l:'Nombre de mensualités',ty:'tel'},{k:'mens',l:'Montant par mois (€)',ty:'text',h:'Vide : calcul automatique.'}],if:x=>x.remb==='echeancier'},
   {row:[{k:'jour',l:'Jour du mois',ty:'tel',h:'Exemple : 5'},{k:'rdebut',l:'À partir du',ty:'date'}],if:x=>x.remb==='echeancier'},
   {k:'interets',l:'Intérêts',ty:'radio',o:[['non','Sans intérêts'],['oui','Avec intérêts']]},
   {k:'taux',l:'Taux annuel (%)',ty:'text',if:x=>x.interets==='oui',sub:1}]},
  {t:'La somme écrite de votre main',pre:()=>{const m=num(d.montant);return `<div class="note"><p>Recopiez avec le doigt la somme <b>en chiffres</b>, puis <b>en lettres</b>, dans les cadres ci-dessous (vous pouvez tourner le téléphone pour écrire plus à l’aise).</p></div>
 ${handPad('pad0','dm0','1. En chiffres : '+eur(m))}${handPad('pad1','dm1','2. En lettres : '+(enLettres(m)||'… (indiquez d’abord le montant à l’étape 4)'))}`},
   pads:[['pad0','dm0'],['pad1','dm1']],recapRows:()=>[['Somme écrite à la main',d.dm0t&&d.dm1t?'Oui (chiffres et lettres)':'Incomplète']],fields:[]},
  sigStep(),
  {t:'Récapitulatif et envoi',recap:1,fields:[]}
 ],
 recapSkip:[],recapMore:()=>[],
 recapBefore:()=>preview('RECONNAISSANCE DE DETTE',detteParas()),
 missing(){const m=[];if(!d.a_nom||!d.a_prenom)m.push('vos nom et prénom');if(!d.a_adr)m.push('votre adresse');if(!d.b_nom)m.push('le créancier');
  if(!(num(d.montant)>0))m.push('montant');if(d.remb==='echeancier'?!(d.nb&&d.rdebut):!d.rdate)m.push('date de remboursement');
  if(!d.dm0t||!d.dm1t)m.push('somme écrite à la main');if(!d.sigt)m.push('signature');return m},
 missWarn:'Vous pouvez quand même produire le PDF, mais une reconnaissance de dette incomplète sera plus difficile à faire valoir.',
 mailHint:'mail de la personne qui vous a prêté',
 recapAfter:()=>`<div class="note" style="margin-top:16px"><p><b>Ensuite :</b> remettez le document signé à la personne qui vous a prêté (par mail ou imprimé) et gardez-en une copie.${num(d.montant)>5000?' Ce prêt dépasse 5 000 € : déclarez-le aux impôts (formulaire 2062, en ligne sur impots.gouv.fr).':''}</p></div>`,
 fname:()=>{const n=fnPart(d.a_nom);return `Reconnaissance_dette${n?'_'+n:''}_${d.le||today}.pdf`},
 mail(){const who=pName('a_');return {to:clean1(d.mailto),subj:`Reconnaissance de dette — ${eur(num(d.montant))}`,body:`Bonjour,\n\nVeuillez trouver ci-joint la reconnaissance de dette signée pour la somme de ${eur(num(d.montant))}.\n\nCordialement,\n${who}`}},
 build(){const P=detteParas();return paperPDF({title:'RECONNAISSANCE DE DETTE',sub:'Acte sous signature privée (article 1376 du code civil)',
  blocks:[...P.map(p=>({p})),{hand:['dm0','dm1'],cap:'Somme écrite de la main du débiteur, en chiffres et en lettres :'}],
  sigs:[{key:'sig',label:'Signature du débiteur',name:pName('a_')}],docTitle:'Reconnaissance de dette'})}
};

/* ================= Document 4 : attestation d'hébergement ================= */
function hebergParas(){
 const L=[];
 L.push(`Je soussigné${pE('a_')} ${pText('a_')},`);
 L.push(`certifie sur l’honneur héberger à mon domicile${d.gratuit==='oui'?', à titre gratuit,':''} depuis le ${fr(d.depuis)||'…'} :`);
 L.push(`${pText('b_',{addr:false})}${clean1(d.lien)?' ('+clean1(d.lien)+')':''}.`);
 if(clean1(d.autres))L.push(`Ainsi que : ${clean1(d.autres)}.`);
 if(d.statut)L.push(`Je suis ${d.statut==='proprio'?'propriétaire':'locataire'} de ce logement.`);
 L.push(`Je suis informé${pE('a_')} que l’établissement d’une attestation faisant état de faits matériellement inexacts est puni d’un an d’emprisonnement et de 15 000 € d’amende (article 441-7 du code pénal).`);
 L.push(`Attestation établie pour servir et valoir ce que de droit.`);
 L.push(faitLe()+'.');
 if(myPh().length)L.push(`Pièces jointes : copie de ma pièce d’identité et justificatif de domicile.`);
 return L;
}
const HEBERG={
 key:'attest_heberg_v1',title:'Attestation d’hébergement',sub:'Pour la mairie, la préfecture, la CAF…',
 init:x=>{if(!x.le)x.le=today;if(!x.gratuit)x.gratuit='oui'},
 maxPh:3,phLabels:['Pièce jointe 1','Pièce jointe 2','Pièce jointe 3'],
 phIntro:()=>`<p>L’administration demande en général de joindre <b>la copie de votre pièce d’identité</b> et <b>un justificatif de domicile à votre nom de moins de 3 mois</b> (facture d’électricité, quittance de loyer, avis de taxe foncière…).</p><p>Photographiez-les : les photos sont ajoutées à la fin du PDF (3 au maximum).</p>`,
 phBtn:n=>['Photographier votre pièce d’identité','Ajouter le verso ou le justificatif de domicile','Ajouter le justificatif de domicile'][n]||'Ajouter une photo',
 steps:[
  {t:'Avant de commencer',pre:()=>`<div class="note"><p><b>À quoi sert ce document ?</b> L’attestation d’hébergement prouve qu’une personne habite chez vous. Elle sert à la personne hébergée pour ses démarches : carte d’identité, passeport, préfecture, CAF, France Travail, inscription scolaire…</p></div>
 <div class="note warn"><ul>
  <li>C’est <b>vous, la personne qui héberge</b>, qui remplissez et signez.</li>
  <li>Ne la confondez pas avec l’<b>attestation d’accueil</b> (Cerfa 10798), demandée en mairie pour recevoir un visiteur étranger : celle-là n’est pas faite par cette appli.</li>
  <li>Une fausse attestation est punie d’un an de prison et de 15 000 € d’amende (article 441-7 du code pénal).</li></ul></div>`,fields:[]},
  {t:'Vous, qui hébergez',fields:[...personFields('a_'),{k:'statut',l:'Pour ce logement, vous êtes',ty:'radio',o:[['proprio','Propriétaire'],['loc','Locataire']],h:'Facultatif.'}]},
  {t:'La personne hébergée',fields:[...personFields('b_',{addr:false}),
   {k:'lien',l:'Lien avec vous',ty:'text',h:'Facultatif. Exemple : « mon fils », « un ami ».'},
   {k:'depuis',l:'Hébergée chez vous depuis le',ty:'date'},
   {k:'gratuit',l:'À titre gratuit (sans loyer) ?',ty:'radio',o:YN},
   {k:'autres',l:'Autres personnes hébergées',ty:'text',h:'Facultatif. Exemple : « ses enfants Léa MARTIN, née le 02/03/2015, et Tom MARTIN, né le 05/09/2018 ».'}]},
  {t:'Pièces jointes',photos:1,pre:()=>photosHTML(),recapRows:()=>[['Pièces jointes',phCount()]],fields:[]},
  sigStep(),
  {t:'Récapitulatif et envoi',recap:1,fields:[]}
 ],
 recapSkip:[],recapMore:()=>[],
 recapBefore:()=>preview('ATTESTATION D’HÉBERGEMENT',hebergParas()),
 missing(){const m=[];if(!d.a_nom||!d.a_prenom)m.push('vos nom et prénom');if(!d.a_adr||!d.a_ville)m.push('votre adresse');if(!d.b_nom)m.push('personne hébergée');
  if(!d.depuis)m.push('date de début');if(!d.sigt)m.push('signature');if(!myPh().length)m.push('pièces jointes');return m},
 missWarn:'Vous pouvez quand même produire le PDF, mais l’administration risque de demander les éléments manquants.',
 mailHint:'personne hébergée, administration…',
 recapAfter:()=>`<div class="note" style="margin-top:16px"><p>Envoyez le PDF à la personne hébergée : elle le joindra à son dossier.</p></div>`,
 fname:()=>{const n=fnPart(d.b_nom);return `Attestation_hebergement${n?'_'+n:''}_${d.le||today}.pdf`},
 mail(){return {to:clean1(d.mailto),subj:`Attestation d’hébergement — ${pName('b_')}`,body:`Bonjour,\n\nVeuillez trouver ci-joint l’attestation d’hébergement signée, avec ma pièce d’identité et mon justificatif de domicile.\n\nCordialement,\n${pName('a_')}`}},
 build(){return paperPDF({title:'ATTESTATION D’HÉBERGEMENT',blocks:hebergParas().map(p=>({p})),
  sigs:[{key:'sig',label:'Signature de l’hébergeant',name:pName('a_')}],ph:myPh(),annexTitle:'Pièces jointes : pièce d’identité et justificatif de domicile de l’hébergeant',docTitle:'Attestation d’hébergement'})}
};

/* ================= Document 5 : cession d'un chien ou d'un chat ================= */
const ESP=()=>d.espece==='chat'?'chat':'chien';
function animalBlocks(){
 const remis=[d.vetdate&&`le certificat vétérinaire établi le ${fr(d.vetdate)}`,d.docinfo==='oui'&&'le document d’information sur les caractéristiques et les besoins de l’animal',d.carnet==='oui'&&'le carnet de santé ou de vaccination',
  'la carte d’identification de l’animal, signée par le cédant pour le changement de détenteur'].filter(Boolean);
 return [
  {h:'Le cédant'},{kv:[['Nom',[pCiv('a_'),pName('a_')].filter(Boolean).join(' ')],['Adresse',pAddr('a_')],['Téléphone',d.a_tel],['N° SIREN / éleveur',d.a_siren]]},
  {h:'L’acquéreur'},{kv:[['Nom',[pCiv('b_'),pName('b_')].filter(Boolean).join(' ')],['Adresse',pAddr('b_')],['Téléphone',d.b_tel]]},
  {h:'L’animal'},{kv:[['Espèce',d.espece==='chat'?'Chat':d.espece==='chien'?'Chien':''],['Nom',d.anom],['Race',clean1(d.race)||'N’appartient pas à une race'],['Inscription LOF / LOOF',d.lof],['Sexe',d.sexe==='f'?'Femelle':d.sexe==='m'?'Mâle':''],['Date de naissance',fr(d.anaiss)],['Robe (couleur)',d.robe],['N° d’identification',d.ident],['Stérilisé(e)',d.steril==='oui'?'Oui':d.steril==='non'?'Non':'']]},
  {h:'Conditions de la cession'},
  {p:d.mode==='vente'?`L’animal est vendu au prix de ${eur(num(d.prix))}${MODES[d.paie]?', payé '+MODES[d.paie]:''}.`:`L’animal est cédé à titre gratuit (don).`},
  {p:`L’animal est remis à l’acquéreur le ${fr(d.remise)||'…'}. Sont remis avec lui : ${remis.join(' ; ')}.`},
  d.ced&&{p:`L’acquéreur déclare avoir signé le certificat d’engagement et de connaissance des besoins spécifiques de l’espèce le ${fr(d.ced)}, au moins sept jours avant la cession.`},
  {p:`Le cédant déclare que l’animal est identifié et enregistré à son nom au fichier national d’identification (I-CAD). Les parties s’engagent à faire enregistrer sans délai le changement de détenteur.`},
  d.mode==='vente'&&{p:`La vente est soumise aux dispositions du code rural et de la pêche maritime relatives aux vices rédhibitoires (articles L. 213-1 et suivants).`},
  {p:`${faitLe()}, en deux exemplaires, un pour chaque partie.`}
 ];
}
const ANIMAL={
 key:'attest_animal_v1',title:'Cession d’un chien ou d’un chat',sub:'Attestation de cession (vente ou don)',
 init:x=>{if(!x.le)x.le=today;if(!x.remise)x.remise=today},
 steps:[
  {t:'Avant de commencer',pre:()=>`<div class="note"><p><b>À quoi sert ce document ?</b> Quand on <b>vend</b> un chien ou un chat, la loi demande de remettre une <b>attestation de cession</b> au nouveau propriétaire (article L. 214-8 du code rural). Pour un <b>don</b>, elle est fortement conseillée. Elle prouve le changement de propriétaire.</p></div>
 <div class="note warn"><p><b>Avant la cession, vérifiez :</b></p><ul>
  <li>L’animal doit être <b>identifié</b> (puce ou tatouage) et avoir <b>au moins 8 semaines</b>.</li>
  <li>Un <b>certificat vétérinaire</b> récent (en principe de moins de 3 mois) doit être remis avec l’animal.</li>
  <li>Pour une première acquisition, l’acquéreur doit avoir signé un <b>certificat d’engagement et de connaissance</b> au moins <b>7 jours avant</b> de recevoir l’animal.</li>
  <li>Un particulier qui vend des chiots ou des chatons doit en principe avoir un numéro SIREN (sauf exceptions, notamment pour une portée par an d’animaux inscrits au LOF ou au LOOF).</li>
  <li>Après la cession, faites le <b>changement de détenteur</b> auprès de l’I-CAD (i-cad.fr).</li></ul>
  <p>Ces règles évoluent : en cas de doute, demandez à votre vétérinaire.</p></div>`,fields:[]},
  {t:'Vente ou don ?',fields:[
   {k:'mode',l:'L’animal est…',ty:'radio',o:[['vente','Vendu'],['don','Donné (gratuit)']]},
   {k:'prix',l:'Prix (€)',ty:'text',if:x=>x.mode==='vente'},
   {k:'paie',l:'Payé par',ty:'radio',o:[['virement','Virement'],['cheque','Chèque'],['especes','Espèces']],if:x=>x.mode==='vente'},
   {k:'remise',l:'Date de remise de l’animal',ty:'date'}]},
  {t:'Le cédant (qui vend ou donne)',fields:[...personFields('a_',{birth:false}),{row:[{k:'a_tel',l:'Téléphone',ty:'tel',h:'Facultatif'},{k:'a_siren',l:'N° SIREN ou d’éleveur',ty:'text',h:'Si vous en avez un'}]}]},
  {t:'L’acquéreur (nouveau propriétaire)',fields:[...personFields('b_',{birth:false}),{k:'b_tel',l:'Téléphone',ty:'tel',h:'Facultatif'}]},
  {t:'L’animal',fields:[
   {k:'espece',l:'Espèce',ty:'radio',o:[['chien','Chien'],['chat','Chat']]},
   {k:'anom',l:'Nom de l’animal',ty:'text'},
   {k:'sexe',l:'Sexe',ty:'radio',o:[['m','Mâle'],['f','Femelle']]},
   {k:'race',l:'Race',ty:'text',h:'Seul un animal inscrit au LOF (chien) ou au LOOF (chat) peut être dit « de race ». Sinon, laissez vide ou écrivez par exemple « type berger allemand ».'},
   {k:'lof',l:'N° d’inscription LOF / LOOF',ty:'text',h:'Facultatif.'},
   {row:[{k:'anaiss',l:'Date de naissance',ty:'date'},{k:'robe',l:'Robe (couleur)',ty:'text'}]},
   {k:'ident',l:'N° d’identification (puce ou tatouage)',ty:'text',h:'15 chiffres pour une puce, sur la carte d’identification I-CAD.'},
   {k:'steril',l:'Stérilisé(e) ?',ty:'radio',o:YN}]},
  {t:'Documents remis',fields:[
   {k:'vetdate',l:'Date du certificat vétérinaire',ty:'date'},
   {k:'docinfo',l:'Document d’information sur les besoins de l’animal remis ?',ty:'radio',o:YN},
   {k:'carnet',l:'Carnet de santé ou de vaccination remis ?',ty:'radio',o:YN},
   {k:'ced',l:'Date de signature du certificat d’engagement par l’acquéreur',ty:'date',h:'Au moins 7 jours avant la remise. Laissez vide si l’acquéreur a déjà eu un animal de cette espèce.'}]},
  {t:'Date et signatures',fields:[{row:[{k:'faita',l:'Fait à',ty:'text'},{k:'le',l:'Le',ty:'date'}]}],
   post:()=>padBox('sigT','sig','Signature du cédant','Le cédant signe avec le doigt')+padBox('sigB','sigb','Signature de l’acquéreur','L’acquéreur signe avec le doigt'),
   pads:[['sigT','sig'],['sigB','sigb']],recapRows:()=>[['Signature du cédant',d.sigt?'Oui':'Non'],['Signature de l’acquéreur',d.sigbt?'Oui':'Non']]},
  {t:'Récapitulatif et envoi',recap:1,fields:[]}
 ],
 recapSkip:[],recapMore:()=>[],
 missing(){const m=[];if(!d.mode)m.push('vente ou don');if(d.mode==='vente'&&!clean1(d.prix))m.push('prix');if(!d.a_nom)m.push('cédant');if(!d.b_nom)m.push('acquéreur');
  if(!d.espece)m.push('espèce');if(!clean1(d.ident))m.push('n° d’identification');if(!d.vetdate)m.push('certificat vétérinaire');if(!d.sigt)m.push('signature du cédant');if(!d.sigbt)m.push('signature de l’acquéreur');return m},
 missWarn:'Vous pouvez quand même produire le PDF, mais complétez ces informations avant la remise de l’animal.',
 mailHint:'mail de l’acquéreur',
 recapAfter:()=>`<div class="note" style="margin-top:16px"><p><b>Ensuite :</b> chacun garde un exemplaire (envoyez le PDF à l’acquéreur). Pensez au changement de détenteur sur i-cad.fr.</p></div>`,
 fname:()=>{const n=fnPart(d.anom);return `Cession_${ESP()}${n?'_'+n:''}_${d.le||today}.pdf`},
 mail(){return {to:clean1(d.mailto),subj:`Attestation de cession — ${ESP()}${d.anom?' '+clean1(d.anom):''}`,body:`Bonjour,\n\nVeuillez trouver ci-joint l’attestation de cession signée${d.anom?` pour ${clean1(d.anom)}`:''}.\n\nCordialement,\n${pName('a_')}`}},
 build(){return paperPDF({title:`ATTESTATION DE CESSION D’UN ${ESP().toUpperCase()}`,sub:'Article L. 214-8 du code rural et de la pêche maritime',sz:9.6,blocks:animalBlocks(),
  sigs:[{key:'sig',label:'Le cédant',name:pName('a_')},{key:'sigb',label:'L’acquéreur',name:pName('b_')}],docTitle:`Attestation de cession d’un ${ESP()}`})}
};

const DOCS={temoin:TEMOIN,demeure:DEMEURE,dette:DETTE,heberg:HEBERG,animal:ANIMAL};
async function finish(doc){doc.setAuthor('');doc.setCreator('Attestations faciles - Vitfix');doc.setProducer('Attestations faciles - Vitfix');return await doc.save()}

/* ================= Photos (pièce d'identité du témoin) ================= */
let photos=[];const purls=new Map();
const myPh=()=>photos.filter(p=>(p.doc||'temoin')===view);
const phCount=()=>{const n=myPh().length;return n?n+' photo'+(n>1?'s':''):'Aucune photo'};
const IDB=(()=>{let p;
 const db=()=>p||(p=new Promise((res,rej)=>{const r=indexedDB.open('attestations',1);r.onupgradeneeded=()=>r.result.createObjectStore('files',{keyPath:'id'});r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)}));
 const tx=async(m,f)=>{const x=await db();return new Promise((res,rej)=>{const t=x.transaction('files',m),r=f(t.objectStore('files'));t.oncomplete=()=>res(r&&r.result);t.onerror=()=>rej(t.error)})};
 return{all:()=>tx('readonly',s=>s.getAll()),put:o=>tx('readwrite',s=>s.put(o)),del:id=>tx('readwrite',s=>s.delete(id)),clear:()=>tx('readwrite',s=>s.clear())};
})();
const purl=p=>{if(!purls.has(p.id))purls.set(p.id,URL.createObjectURL(p.blob));return purls.get(p.id)};
async function shrink(file){
 let src;
 try{src=await createImageBitmap(file,{imageOrientation:'from-image'})}
 catch(e){src=await new Promise((res,rej)=>{const im=new Image();im.onload=()=>res(im);im.onerror=()=>rej(new Error('format d’image non pris en charge'));im.src=URL.createObjectURL(file)})}
 const sc=Math.min(1,1600/Math.max(src.width,src.height)),w=Math.round(src.width*sc),h=Math.round(src.height*sc);
 const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,w,h);x.drawImage(src,0,0,w,h);
 const blob=await new Promise(r=>c.toBlob(r,'image/jpeg',.82));if(!blob)throw new Error('conversion impossible');
 return{id:Date.now().toString(36)+Math.random().toString(36).slice(2,7),blob,w,h,t:Date.now()};
}
const phLab=i=>(doc.phLabels||[])[i]||'Photo '+(i+1);
function photosHTML(){
 const ph=myPh();
 return `<div class="note">${doc.phIntro()}</div>
 <div class="phgrid">${ph.map((p,i)=>`<figure class="ph"><img src="${purl(p)}" alt="${esc(phLab(i))}"><figcaption><span>${esc(phLab(i))}</span><button type="button" class="link" data-delph="${p.id}">Supprimer</button></figcaption></figure>`).join('')}</div>
 ${ph.length<doc.maxPh?`<div class="phadd"><label class="btn pri phbtn">${esc(doc.phBtn(ph.length))}<input type="file" accept="image/*" capture="environment" data-addph hidden></label><label class="btn phbtn">Choisir dans la galerie<input type="file" accept="image/*" data-addph hidden></label></div>`:''}
 <div id="phmsg"></div>`;
}
document.addEventListener('change',async e=>{
 if(!e.target.matches('[data-addph]'))return;
 const files=[...e.target.files].slice(0,doc.maxPh-myPh().length);let err='';
 for(const f of files){try{const p=await shrink(f);p.doc=view;photos.push(p);try{await IDB.put(p)}catch(x){}}catch(x){err=x.message||String(x)}}
 keepScroll();
 if(err)$('#phmsg').innerHTML=`<div class="msg err">La photo n’a pas pu être ajoutée : ${esc(err)}</div>`;
});


/* ================= Publicité (appli Android uniquement, jamais dans la version web) =================
   IDENTIFIANTS DE TEST GOOGLE : à remplacer par ceux du compte AdMob de Hugo avant la mise en production.
   L'identifiant d'APPLICATION AdMob (ca-app-pub-…~…) est dans scripts/patch-android.mjs (ADMOB_APP_ID). */
const ADS={enabled:true,test:true,interstitial:'ca-app-pub-3940256099942544/1033173712',gapMs:3*60*1000,maxWaitMs:3000,safetyMs:45000};
const Ads=(()=>{
 const A=NATIVE&&ADS.enabled&&CAP.Plugins&&CAP.Plugins.AdMob;
 let ready=false,loaded=false,loading=null,last=0,privacy=false;
 const wait=ms=>new Promise(r=>setTimeout(r,ms));
 function load(){if(!ready||loaded)return Promise.resolve();if(!loading)loading=A.prepareInterstitial({adId:ADS.interstitial,isTesting:ADS.test}).then(()=>{loaded=true}).catch(()=>{}).finally(()=>{loading=null});return loading}
 async function init(){
  if(!A)return;
  try{
   let c=await A.requestConsentInfo();                       // formulaire de consentement Google (RGPD) au besoin
   if(c.isConsentFormAvailable&&c.status==='REQUIRED')c=await A.showConsentForm();
   privacy=c.privacyOptionsRequirementStatus==='REQUIRED';
   if(view==='home')render();
   if(!c.canRequestAds)return;                               // pas de consentement : aucune pub
   await A.initialize({initializeForTesting:ADS.test});      // le SDK applique lui-même le choix (pubs non personnalisées si refus)
   ready=true;load();
  }catch(e){}
 }
 // Montre au plus une pub toutes les gapMs, puis rend la main. Ne bloque jamais le PDF.
 async function gate(){
  if(!ready||Date.now()-last<ADS.gapMs)return;
  if(!loaded){await Promise.race([load(),wait(ADS.maxWaitMs)]);if(!loaded){last=Date.now();return}}   // pub pas prête : on n’attend plus avant gapMs
  loaded=false;
  await new Promise(res=>{
   let done=false,hs=[];const fin=()=>{if(done)return;done=true;hs.forEach(h=>{try{h.remove()}catch(e){}});res()};
   Promise.all([A.addListener('interstitialAdDismissed',fin),A.addListener('interstitialAdFailedToShow',fin)])
    .then(a=>{hs=a;if(done)a.forEach(h=>{try{h.remove()}catch(e){}});return A.showInterstitial()})
    .then(()=>{last=Date.now()}).catch(fin);
   setTimeout(fin,ADS.safetyMs);
  });
  load();
 }
 const showPrivacy=()=>A?A.showPrivacyOptionsForm().catch(()=>{}):Promise.resolve();
 return {init,gate,hasPrivacy:()=>privacy,showPrivacy};
})();

/* ================= Moteur d'écrans ================= */
let view='home',doc=null,d={},cur=0;
function open(id){
 view=id;doc=DOCS[id];
 try{d=JSON.parse(localStorage.getItem(doc.key)||'{}')}catch(e){d={}}
 doc.init(d);cur=Math.min(+(d._step||0),doc.steps.length-1);
}
const save=()=>{if(doc)try{localStorage.setItem(doc.key,JSON.stringify(d))}catch(e){}};
{const v=new URLSearchParams(location.search).get('doc')||localStorage.getItem('attest_view');if(DOCS[v])open(v)}

const sigHTML=hint=>`<div class="f"><span class="lab">Votre signature</span><canvas class="sig" id="sigT"></canvas><div class="sigbar"><span>${hint}</span><button type="button" class="link" data-clear="sig">Effacer</button></div></div>`;
function fieldHTML(f){
 if(f.row){if(f.if&&!f.if(d))return '';return `<div class="row">${f.row.map(fieldHTML).join('')}</div>`}
 if(f.if&&!f.if(d))return '';
 const id='f_'+f.k,v=d[f.k];let inner='';
 if(f.ty==='area')inner=`<textarea id="${id}" data-k="${f.k}"${f.big?' class="big"':''}>${esc(v)}</textarea>`;
 else if(f.ty==='radio')inner=`<div class="opts" role="group">${f.o.map(([val,lab])=>`<label class="opt"><input type="radio" name="${f.k}" value="${val}" data-k="${f.k}" data-ty="radio" ${v===val?'checked':''}><span>${lab}</span></label>`).join('')}</div>`;
 else inner=`<input id="${id}" data-k="${f.k}" type="${f.ty}" value="${esc(v)}"${f.ty==='tel'?' inputmode="numeric"':''}${f.ty==='email'?' inputmode="email"':''}${f.ac?` autocomplete="${f.ac}"`:''}>`;
 const lab=f.ty==='radio'?`<span class="lab">${f.l}</span>`:`<label for="${id}">${f.l}</label>`;
 return `<div class="f${f.sub?' sub':''}">${lab}${inner}${f.h?`<small>${f.h}</small>`:''}</div>`;
}
function homeHTML(){
 return `<div class="docs">${CATALOG.map(c=>`<button type="button" class="doc" ${c.soon?'disabled':`data-open="${c.id}"`}><span class="ico">${ICON}</span><span><b>${esc(c.t)}</b><span>${esc(c.s)}</span></span>${c.soon?'<i>Bientôt</i>':''}</button>`).join('')}</div>
 <p class="indep"><b>Application indépendante</b>, éditée par Vitfix. Elle n’est ni éditée ni validée par l’administration française. Les formulaires officiels et leurs notices sont disponibles gratuitement sur service-public.fr. Cette application ne remplace pas le conseil d’un avocat.</p>${Ads.hasPrivacy()?'<p class="indep"><button type="button" class="link" id="adpriv">Choix de confidentialité (publicités)</button></p>':''}`;
}
function render(){
 localStorage.setItem('attest_view',view);
 const home=view==='home';
 $('#home').hidden=home;$('#progw').hidden=home;$('#nav').hidden=home;
 if(home){$('#title').textContent='Attestations faciles';$('#sub').textContent='Vos documents remplis pas à pas, signés et envoyés en PDF';$('#dots').innerHTML='';$('#view').innerHTML=homeHTML();window.scrollTo({top:0});return}
 const S=doc.steps,s=S[cur];d._step=cur;save();
 $('#title').textContent=doc.title;$('#sub').textContent=doc.sub;
 $('#bar').style.width=((cur+1)/S.length*100)+'%';
 $('#dots').innerHTML=S.map((x,i)=>`<button type="button" data-go="${i}" class="${i===cur?'on':i<cur?'done':''}" aria-label="Étape ${i+1} : ${esc(x.t)}">${i+1}</button>`).join('');
 let h=`<p class="kicker">Étape ${cur+1} sur ${S.length}</p><h2>${esc(s.t)}</h2>`;
 if(s.pre)h+=s.pre();
 h+=s.fields.map(fieldHTML).join('');
 if(s.post)h+=s.post();
 if(s.recap)h+=recapHTML();
 $('#view').innerHTML=`<form class="step" id="step" autocomplete="on">${h}</form>`;
 $('#step').addEventListener('submit',e=>e.preventDefault());
 $('#prev').textContent=cur===0?'Documents':'Précédent';
 $('#next').textContent=cur===S.length-1?'Nouveau document':cur===S.length-2?'Voir le récapitulatif':cur===0?'Commencer':'Suivant';
 (s.pads||[]).forEach(([id,k])=>setupPad(id,k));
 if(s.recap)bindRecap();
 window.scrollTo({top:0});
}
function keepScroll(){const y=window.scrollY;render();window.scrollTo({top:y})}

function recapHTML(){
 const S=doc.steps;
 const FLAT=S.flatMap((s,i)=>s.fields.flatMap(f=>(f.row||[f]).map(x=>({...x,if:x.if||f.if}))).map(f=>({...f,step:i})));
 const show=f=>{const v=d[f.k];if(v==null||v==='')return null;if(f.o)return(f.o.find(o=>o[0]===v)||[,v])[1];if(f.ty==='date')return fr(v);return v};
 const groups=S.map((s,i)=>{if(s.recap||!s.fields.length&&!s.recapRows)return '';
  const rows=FLAT.filter(f=>f.step===i&&(!f.if||f.if(d))&&!doc.recapSkip.includes(f.k)).map(f=>[f.l,show(f)]).filter(r=>r[1]).concat(doc.recapMore(i),s.recapRows?s.recapRows():[]);
  return `<section><h3>${esc(s.t)}<button type="button" class="link" data-go="${i}">Modifier</button></h3>${rows.length?`<dl>${rows.map(r=>`<dt>${esc(r[0].length>70?r[0].slice(0,60)+'…':r[0])}</dt><dd>${esc(r[1])}</dd>`).join('')}</dl>`:'<small style="color:var(--mute)">Non renseigné</small>'}</section>`}).join('');
 const m=doc.missing();
 return `${m.length?`<div class="note warn"><p class="miss">À compléter : ${esc(m.join(', '))}.</p><p>${doc.missWarn}</p></div>`:''}
 ${doc.recapBefore?doc.recapBefore():''}
 <div class="recap">${groups}</div>
 <div class="actions">
  <div class="f" style="margin:6px 0 0"><label for="mailto">Envoyer à (mail)</label><input id="mailto" type="email" inputmode="email" data-k="mailto" value="${esc(d.mailto||'')}" placeholder="${esc(doc.mailHint)}"></div>
  <button type="button" class="btn pri" id="mail">Envoyer par mail (PDF joint)</button>
  <button type="button" class="btn" id="dl">Enregistrer le PDF</button>
  <p class="mailbox">${NATIVE?'Choisissez Gmail ou Outlook dans la liste : le PDF est joint automatiquement.':'Le PDF est joint si votre navigateur le permet ; sinon, enregistrez-le puis joignez-le au mail.'}</p>
 </div>${doc.recapAfter?doc.recapAfter():''}<div id="out"></div>`;
}

document.addEventListener('input',e=>{const k=e.target.dataset.k;if(!k||!doc)return;
 d[k]=e.target.value;save();
 const s=doc.steps[cur];if(s.live&&s.live.includes(k))s.liveFn();
 if(e.target.dataset.ty){const y=window.scrollY,nm=e.target.name,val=e.target.value;render();window.scrollTo({top:y});const el=document.querySelector(`input[name="${nm}"][value="${val}"]`);el&&el.focus({preventScroll:true})}
});
document.addEventListener('click',e=>{
 const o=e.target.closest('[data-open]');if(o){open(o.dataset.open);render();return}
 const g=e.target.closest('[data-go]');if(g){cur=+g.dataset.go;render();return}
 const c=e.target.closest('[data-clear]');if(c){const k=c.dataset.clear;delete d[k];delete d[k+'t'];save();keepScroll();return}
 const dp=e.target.closest('[data-delph]');if(dp){const id=dp.dataset.delph;photos=photos.filter(x=>x.id!==id);if(purls.has(id)){URL.revokeObjectURL(purls.get(id));purls.delete(id)}IDB.del(id).catch(()=>{});keepScroll()}
});
const goHome=()=>{view='home';doc=null;render()};
document.addEventListener('click',e=>{if(e.target.closest('#adpriv'))Ads.showPrivacy()});
$('#home').onclick=goHome;
$('#prev').onclick=()=>{if(cur>0){cur--;render()}else goHome()};
$('#next').onclick=()=>{
 if(cur===doc.steps.length-1){const ok=$('#out');ok.innerHTML=`<div class="msg">Effacer toutes les réponses${doc.maxPh?', les signatures et les photos':' et les signatures'}, et commencer un nouveau document ? <button type="button" class="link" id="reset">Oui, effacer</button></div>`;
  $('#reset').onclick=()=>{d={};doc.init(d);save();for(const p of myPh()){if(purls.has(p.id)){URL.revokeObjectURL(purls.get(p.id));purls.delete(p.id)}IDB.del(p.id).catch(()=>{})}photos=photos.filter(p=>(p.doc||'temoin')!==view);cur=0;render()};ok.scrollIntoView({behavior:'smooth'});return}
 cur++;render()};

/* ================= Écriture au doigt ================= */
function setupPad(id,key){
 const cv=document.getElementById(id);if(!cv)return;
 const r=cv.getBoundingClientRect(),dpr=window.devicePixelRatio||1;
 cv.width=r.width*dpr;cv.height=r.height*dpr;
 const ctx=cv.getContext('2d');ctx.scale(dpr,dpr);ctx.lineWidth=key==='sig'?2.4:2.2;ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle='#0a2a6b';
 if(d[key]){const im=new Image();im.onload=()=>ctx.drawImage(im,0,0,r.width,r.height);im.src=d[key]}
 let drawing=false,last=null;
 const pos=e=>{const b=cv.getBoundingClientRect();return[e.clientX-b.left,e.clientY-b.top]};
 cv.onpointerdown=e=>{drawing=true;last=pos(e);try{cv.setPointerCapture(e.pointerId)}catch(x){}ctx.beginPath();ctx.arc(last[0],last[1],1.1,0,7);ctx.fillStyle='#0a2a6b';ctx.fill()};
 cv.onpointermove=e=>{if(!drawing)return;const p=pos(e);ctx.beginPath();ctx.moveTo(...last);ctx.lineTo(...p);ctx.stroke();last=p};
 const end=()=>{if(!drawing)return;drawing=false;const t=trim(cv);if(t){d[key]=cv.toDataURL('image/png');d[key+'t']=t}save();const bar=cv.nextElementSibling&&cv.nextElementSibling.firstElementChild;if(bar&&key!=='sig')bar.textContent=key.startsWith('sig')?'✓ Signé':'✓ Écrit'};
 cv.onpointerup=end;cv.onpointercancel=end;
}
function trim(cv){
 const ctx=cv.getContext('2d'),{width:w,height:h}=cv,px=ctx.getImageData(0,0,w,h).data;
 let x0=w,y0=h,x1=0,y1=0;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(px[(y*w+x)*4+3]>0){if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y}
 if(x1<x0)return undefined;
 const pad=4;x0=Math.max(0,x0-pad);y0=Math.max(0,y0-pad);x1=Math.min(w,x1+pad);y1=Math.min(h,y1+pad);
 const o=document.createElement('canvas');o.width=x1-x0;o.height=y1-y0;o.getContext('2d').drawImage(cv,x0,y0,o.width,o.height,0,0,o.width,o.height);
 return JSON.stringify({u:o.toDataURL('image/png'),top:y0/h,bot:y1/h,ch:h});
}

/* ================= Envoi ================= */
function b64(bytes){let s='';const C=0x8000;for(let i=0;i<bytes.length;i+=C)s+=String.fromCharCode.apply(null,bytes.subarray(i,i+C));return btoa(s)}
async function nativeSend(bytes,{to,subj,body},dialog,model){
 const {Filesystem,Share,EmailIntent}=CAP.Plugins;
 const w=await Filesystem.writeFile({path:doc.fname(model),data:b64(bytes),directory:'CACHE'});
 if(to&&EmailIntent){await EmailIntent.send({to,subject:subj,body,files:[w.uri],title:dialog});return true}
 await Share.share({title:subj,text:body,files:[w.uri],dialogTitle:dialog});return false;
}
const cancelled=e=>/cancel|annul|abort/i.test(String(e&&(e.message||e.errorMessage)||e));
function webDownload(bytes,model){const url=URL.createObjectURL(new Blob([bytes],{type:'application/pdf'}));const a=document.createElement('a');a.href=url;a.download=doc.fname(model);document.body.appendChild(a);a.click();a.remove();return url}
async function sendMail(bytes,parts,dialog){
 const {to,subj,body}=parts;
 if(NATIVE){const pre=await nativeSend(bytes,parts,dialog);return pre||!to?'Mail prêt avec le PDF joint : vérifiez puis envoyez.':'Dans le mail, saisissez le destinataire : <b>'+esc(to)+'</b>'}
 const file=new File([bytes],doc.fname(),{type:'application/pdf'});
 if(navigator.canShare&&navigator.canShare({files:[file]})){await navigator.share({title:subj,text:body,files:[file]});return to?'Destinataire à saisir : <b>'+esc(to)+'</b>':'Partagé.'}
 webDownload(bytes);
 const href=`mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subj)}&body=${encodeURIComponent(body)}`;location.href=href;
 return `PDF téléchargé. <a href="${href}">Ouvrir le mail prêt à envoyer</a> puis joignez-y le PDF.`;
}
async function saveBytes(bytes,model){
 if(NATIVE){try{const {Filesystem}=CAP.Plugins;await Filesystem.writeFile({path:'Attestations/'+doc.fname(model),data:b64(bytes),directory:'DOCUMENTS',recursive:true});return 'PDF enregistré dans Documents › Attestations : '+esc(doc.fname(model))+'.'}
  catch(err){await nativeSend(bytes,{...doc.mail(),to:''},'Enregistrer le PDF',model);return 'Choisissez où enregistrer le PDF (Fichiers, Drive…).'}}
 const url=webDownload(bytes,model);return 'Si le téléchargement ne démarre pas, <a href="'+url+'" target="_blank" rel="noopener">ouvrez le PDF ici</a>.';
}
function bindRecap(){
 const out=$('#out'),say=(t,err)=>out.innerHTML=`<div class="msg${err?' err':''}">${t}</div>`;
 const busy=async(b,model,fn)=>{const lab=b.textContent;b.disabled=true;b.textContent='Un instant…';try{await Ads.gate()}catch(e){}b.textContent='Génération…';try{await fn(await doc.build(model))}catch(e){if(cancelled(e))say('Envoi annulé.');else say('Impossible de terminer : '+esc(e&&e.message||e),1)}b.disabled=false;b.textContent=lab};
 $('#dl').onclick=e=>busy(e.currentTarget,false,async b=>say(await saveBytes(b,false)));
 const mb=$('#model');if(mb)mb.onclick=e=>busy(e.currentTarget,true,async b=>say(await saveBytes(b,true)+' Imprimez aussi le Cerfa vierge (service-public.fr) et recopiez-y le texte à la main.'));
 $('#mail').onclick=e=>busy(e.currentTarget,false,async b=>say(await sendMail(b,doc.mail(),'Envoyer le document')));
}

render();
Ads.init();
IDB.all().then(a=>{photos=(a||[]).sort((x,y)=>x.t-y.t);if(doc&&doc.maxPh){const s=doc.steps[cur];if(s.recap||s.photos)render()}}).catch(()=>{});
window.addEventListener('resize',()=>{if(doc)(doc.steps[cur].pads||[]).forEach(([id,k])=>setupPad(id,k))});
if(NATIVE&&CAP.Plugins.App)CAP.Plugins.App.addListener('backButton',()=>{if(view==='home')CAP.Plugins.App.exitApp();else if(cur>0){cur--;render()}else goHome()});
if(NATIVE&&CAP.Plugins.SplashScreen)CAP.Plugins.SplashScreen.hide();
window.__attest={build:(id,model)=>{open(id);return DOCS[id].build(model)},letter:()=>letter()};
}
