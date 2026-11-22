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
 {id:'retract',t:'Lettre de rétractation',s:'Achat en ligne ou démarchage : 14 jours pour changer d’avis'},
 {id:'resil',t:'Lettre de résiliation',s:'Box, mobile, assurance, mutuelle, salle de sport…'},
 {id:'vol',t:'Indemnisation vol retardé ou annulé',s:'Jusqu’à 600 € par passager (règlement européen 261/2004)'},
 {id:'preavis',t:'Préavis de départ du locataire',s:'1 ou 3 mois : la date de fin calculée, le bon motif cité'},
 {id:'travaux',t:'Demande de travaux au propriétaire',s:'Chauffage, humidité, fuite… photos jointes'},
 {id:'energie',t:'Réclamation facture d’énergie ou d’eau',s:'Électricité, gaz, eau : estimation, erreur de relevé…'},
 {id:'colis',t:'Colis perdu ou abîmé',s:'Réclamation au vendeur ou au transporteur'},
 {id:'procu',t:'Procuration',s:'Autoriser un proche à retirer un colis, un document…'},
 {id:'fps',t:'Contester un forfait post-stationnement (FPS)',s:'Recours à la mairie dans le mois : délai calculé, motifs, justificatifs'},
 {id:'fraude',t:'Paiement frauduleux par carte',s:'Contester un paiement non autorisé et demander le remboursement'},
 {id:'honneur',t:'Attestation sur l’honneur',s:'Domicile, situation, exactitude d’un dossier… avec la mention légale'},
 {id:'recours',t:'Recours CAF, CPAM, France Travail',s:'Contester une décision, un trop-perçu, demander une remise de dette'},
 {id:'conformite',t:'Garantie légale de conformité',s:'Produit en panne : réparation ou remplacement par le vendeur, 2 ans'},
 {id:'sepa',t:'Arrêter un prélèvement',s:'Révoquer un mandat SEPA, se faire rembourser un prélèvement'},
 {id:'depot',t:'Restitution du dépôt de garantie',s:'1 ou 2 mois après la remise des clés : date limite et majoration calculées'},
 {id:'demission',t:'Lettre de démission',s:'Salarié en CDI : préavis, dispense, remise en main propre ou recommandé'},
 {id:'frais',t:'Réclamation pour frais bancaires',s:'Commissions d’intervention, rejets, agios : plafonds légaux rappelés'},
 {id:'echeancier',t:'Demande de délai de paiement',s:'Impôts, facture, loyer, hôpital : un échéancier calculé à proposer'},
 {id:'insalubre',t:'Signaler un logement insalubre',s:'Lettre à la mairie avec photos, mairie trouvée automatiquement'},
 {id:'ast',t:'Autorisation de sortie du territoire',s:'Cerfa 15646*01 — enfant mineur qui voyage sans ses parents'}
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

/* ================= Lettres simples (rétractation, résiliation, vol) : outils communs ================= */
const SENDER=()=>[
 {k:'civ',l:'Vous êtes',ty:'radio',o:CIV},
 {row:[{k:'prenom',l:'Prénom',ty:'text',ac:'given-name'},{k:'nom',l:'Nom',ty:'text',ac:'family-name'}]},
 {k:'adr',l:'Adresse',ty:'text',ac:'address-line1'},
 {row:[{k:'cp',l:'Code postal',ty:'tel',ac:'postal-code'},{k:'ville',l:'Commune',ty:'text',ac:'address-level2'}]},
 {row:[{k:'tel',l:'Téléphone',ty:'tel',ac:'tel',h:'Facultatif'},{k:'mail',l:'Mail',ty:'email',ac:'email',h:'Facultatif'}]}];
const RECIP=(what,ex)=>[
 {k:'dnom',l:`Nom ${what}`,ty:'text',h:ex},
 {k:'dadr',l:'Adresse (service client, service résiliation…)',ty:'text',h:'Elle figure dans vos conditions générales, sur vos factures ou sur le site.'},
 {row:[{k:'dcp',l:'Code postal',ty:'tel'},{k:'dville',l:'Commune',ty:'text'}]},
 {k:'mailto',l:'Son mail',ty:'email',h:'Facultatif : pour envoyer aussi le PDF par mail.'}];
const senderLines=()=>[fullName(),d.adr,[d.cp,d.ville].filter(Boolean).join(' '),d.tel&&'Tél. : '+d.tel,d.mail];
const recipLines=()=>[d.dnom,d.dadr,[d.dcp,d.dville].filter(Boolean).join(' ')];
/* Envoi en recommandé avec AR par un service en ligne (l'utilisateur paie sur le site du service ; Vitfix n'encaisse rien) */
const LRAR_LINKS=[['La Poste','https://www.laposte.fr/envoi-courrier-en-ligne','laposte.fr'],['Merci Facteur','https://www.merci-facteur.com/lettres/lrar/lettre-recommandee.php','merci-facteur.com']];
const lrarAddr=()=>recipLines().map(clean1).filter(Boolean).join('\n');
const lrarBlock=()=>{const a=lrarAddr();return `<div class="note lrar" style="margin-top:16px"><p><b>📮 Envoyer en recommandé avec AR, sans vous déplacer</b></p>
<p>Un service en ligne imprime votre lettre, la poste en <b>recommandé avec accusé de réception</b> et vous renvoie la preuve de dépôt puis l’accusé de réception. Comptez environ 7 à 9 € pour une lettre d’une page, à payer sur leur site.</p>
<ol style="margin:6px 0 8px;padding-left:20px"><li>Enregistrez le PDF de votre lettre.</li><li>Ouvrez un service ci-dessous et envoyez-y le PDF.</li><li>Indiquez l’adresse du destinataire${a?' (à copier ci-dessous)':''}.</li></ol>
${a?`<pre id="lrar-addr" style="white-space:pre-wrap;font:inherit;background:var(--card);border:1px solid var(--line);border-radius:10px;padding:10px 12px;margin:0 0 8px">${esc(a)}</pre><button type="button" class="btn" id="lrar-copy" style="width:100%;margin-bottom:8px">Copier l’adresse du destinataire</button>`:''}
<button type="button" class="btn pri" id="lrar-dl" style="width:100%;margin-bottom:8px">1. Enregistrer le PDF</button>
<div style="display:flex;gap:8px">${LRAR_LINKS.map(([n,u])=>`<a class="btn" style="display:flex;align-items:center;justify-content:center;text-decoration:none;text-align:center" href="${u}" target="_blank" rel="noopener">2. ${n}</a>`).join('')}</div>
<p style="font-size:12.5px;color:var(--mute);margin-top:8px">Services indépendants de Vitfix, payants. Gardez la preuve de dépôt et l’accusé de réception avec votre copie de la lettre.</p></div>`};
const SALUT='Je vous prie d’agréer, Madame, Monsieur, l’expression de mes salutations distinguées.';
const letterPreview=(objet,paras)=>`<div class="note"><p><b>Aperçu de la lettre</b></p><p><b>Objet : ${esc(objet)}</b></p><p>Madame, Monsieur,</p>${paras.map(p=>`<p>${esc(p)}</p>`).join('')}<p style="font-size:13px;color:var(--mute)">Pour modifier le texte, revenez aux étapes précédentes.</p></div>`;
const letterMissing=()=>{const m=[];if(!d.nom||!d.prenom)m.push('vos nom et prénom');if(!d.adr||!d.ville)m.push('votre adresse');if(!d.dnom)m.push('destinataire');if(!d.sigt)m.push('signature');return m};
/* Lettre créée de zéro : expéditeur à gauche, destinataire à droite, objet, paragraphes, signature, annexe photos */
async function letterPDF(o){
 const {PDFDocument,StandardFonts,rgb}=PDFLib;
 const pdf=await PDFDocument.create();
 const font=await pdf.embedFont(StandardFonts.Helvetica),bold=await pdf.embedFont(StandardFonts.HelveticaBold);
 const enc=encoder(font),W=595.28,H=841.89,M=62,TW=W-2*M,SZ=10.6,LH=15,C=rgb(.08,.08,.1);
 let pg=pdf.addPage([W,H]),y=H-60;
 const newPage=()=>{pg=pdf.addPage([W,H]);y=H-60};
 const line=(s,f=font,x=M)=>{if(y<64)newPage();pg.drawText(s,{x,y,size:SZ,font:f,color:C});y-=LH};
 const block=(arr,x=M)=>arr.filter(Boolean).forEach(s=>wrap(enc(clean1(s)),font,SZ,[W-M-x]).forEach(l=>line(l,font,x)));
 block(senderLines());y-=8;
 block(recipLines(),W/2+10);y-=10;
 line(enc(`${clean1(d.faita)||clean1(d.ville)||'…'}, le ${fr(d.le)||'…'}`),font,W/2+10);y-=8;
 const head=o.head!==undefined?o.head:(o.rec===false?'':'Lettre recommandée avec accusé de réception');if(head)line(enc(head),bold);
 for(const s of wrap(enc('Objet : '+o.objet),bold,SZ,[TW]))line(s,bold);
 y-=10;line(enc('Madame, Monsieur,'));y-=6;
 for(const p of [...o.paras,SALUT]){for(const s of wrap(enc(clean1(p)),font,SZ,[TW]))line(s);y-=7}
 y-=6;if(y<150)newPage();
 const sx=W/2+10,s=sigImg('sig');
 if(s){const im=await pdf.embedPng(s.u),k=Math.min(170/im.width,60/im.height);pg.drawImage(im,{x:sx,y:y-im.height*k,width:im.width*k,height:im.height*k});y-=im.height*k+16}
 line(enc(fullName()),font,sx);
 if(o.after&&o.after.length){y-=18;if(y<110)newPage();for(const a of o.after){line(enc(a),bold);y-=10}}
 if(o.pj){y-=10;for(const s2 of wrap(enc(o.pj),font,9.5,[TW]))line(s2)}
 const ph=o.ph||[];
 for(let j=0;j<ph.length;j++){
  if(j%2===0){pg=pdf.addPage([W,H]);pg.drawText(enc(o.annexTitle||'Pièces jointes'),{x:40,y:H-50,size:12,font:bold,color:C})}
  const p=ph[j],im=await pdf.embedJpg(new Uint8Array(await p.blob.arrayBuffer()));
  const top=H-75-(j%2)*370,bw=W-80,bh=330,k=Math.min(bw/im.width,bh/im.height),w=im.width*k,h=im.height*k;
  pg.drawImage(im,{x:40+(bw-w)/2,y:top-bh+(bh-h)/2,width:w,height:h});
  pg.drawText(enc('Pièce jointe '+(j+1)),{x:40,y:top-bh-13,size:9,font,color:C})}
 pdf.setTitle(enc(o.objet));
 return finish(pdf);
}
const letterSigStep=()=>({t:'Date et signature',fields:[{row:[{k:'faita',l:'Fait à',ty:'text'},{k:'le',l:'Le',ty:'date'}]}],post:()=>sigHTML('Signez avec le doigt'),pads:[['sigT','sig']],recapRows:()=>[['Signature',d.sigt?'Oui':'Non']]});
const lrarNote=()=>`<div class="note" style="margin-top:16px"><p><b>Pour avoir une preuve :</b> imprimez le PDF et envoyez-le en <b>lettre recommandée avec accusé de réception</b> (à La Poste ou en ligne). Le mail seul ne prouve pas la date de réception.</p></div>`;
const fnDest=()=>{const n=fnPart(d.dnom);return n?'_'+n:''};

/* Dates : jours fériés français, délai qui finit un samedi, dimanche ou jour férié → jour ouvrable suivant */
const isoD=s=>{if(!s)return null;const [y,m,dd]=s.split('-').map(Number);return new Date(Date.UTC(y,m-1,dd))};
const isoS=dt=>dt.toISOString().slice(0,10);
function paques(y){const a=y%19,b=Math.floor(y/100),c=y%100,dd=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-dd-g+15)%30,i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451),mo=Math.floor((h+l-7*m+114)/31),da=(h+l-7*m+114)%31+1;return Date.UTC(y,mo-1,da)}
function ferie(dt){const md=isoS(dt).slice(5);if(['01-01','05-01','05-08','07-14','08-15','11-01','11-11','12-25'].includes(md))return true;
 const p=paques(dt.getUTCFullYear()),D=864e5;return [p+D,p+39*D,p+50*D].includes(dt.getTime())}
function finDelai(startIso,jours){const s=isoD(startIso);if(!s)return null;let e=new Date(s.getTime()+jours*864e5);while(e.getUTCDay()===0||e.getUTCDay()===6||ferie(e))e=new Date(e.getTime()+864e5);return isoS(e)}
const JOURS=['dimanche','lundi','mardi','mercredi','jeudi','vendredi','samedi'];
const frLong=iso=>{const t=isoD(iso);return t?`${JOURS[t.getUTCDay()]} ${fr(iso)}`:''};

/* ================= Document 6 : lettre de rétractation ================= */
const rStart=()=>d.rtype==='service'?d.cdate:d.recep;
function retractInfo(){
 const st=rStart();if(!st)return {html:`<div class="note"><p>Indiquez la date ${d.rtype==='service'?'de conclusion du contrat':'de réception'} : l’appli calcule la date limite pour vous rétracter.</p></div>`};
 const fin=finDelai(st,14),late=today>fin;
 return {fin,late,html:late?`<div class="note warn"><p><b>Attention : le délai de 14 jours semble dépassé</b> (il se terminait le ${esc(frLong(fin))}). Si le professionnel ne vous a pas informé de votre droit de rétractation, le délai est prolongé de 12 mois (article L. 221-20 du code de la consommation). Sinon, la rétractation risque d’être refusée.</p></div>`
  :`<div class="note"><p><b>Date limite pour envoyer votre lettre : ${esc(frLong(fin))}</b> inclus (14 jours ${d.rtype==='service'?'après la conclusion du contrat':'après la réception'} ; un délai qui finit un samedi, un dimanche ou un jour férié est reporté au jour ouvrable suivant).</p></div>`};
}
function retractParas(){
 const L=[],bien=d.rtype!=='service',ref=clean1(d.cmdref);
 L.push(`Par la présente, je vous notifie ma décision de me rétracter du contrat portant sur ${clean1(d.cmd)||'…'}${ref?` (commande ou contrat n° ${ref})`:''}, conclu le ${fr(d.cdate)||'…'}${bien&&d.recep?` et reçu le ${fr(d.recep)}`:''}${d.canal==='domicile'?', à la suite d’un démarchage à mon domicile':''}.`);
 L.push(`Je vous rappelle que je dispose d’un délai de quatorze jours pour exercer ce droit, sans avoir à motiver ma décision (article L. 221-18 du code de la consommation).`);
 if(bien)L.push(`Je vous renverrai le bien au plus tard dans les quatorze jours suivant la présente lettre (article L. 221-23 du même code). Merci de m’indiquer l’adresse de retour si elle diffère de la vôtre.`);
 L.push(`Conformément à l’article L. 221-24 du même code, je vous demande de me rembourser la totalité des sommes versées${clean1(d.prix)?`, soit ${eur(num(d.prix))}`:''}, frais de livraison initiaux compris, au plus tard dans les quatorze jours suivant la réception de la présente lettre, par le même moyen de paiement que celui utilisé pour l’achat.${bien?' Ce remboursement peut être différé jusqu’à la récupération du bien ou jusqu’à ce que je vous aie fourni une preuve de son expédition.':''}`);
 return L;
}
const retractObjet=()=>`Exercice du droit de rétractation${clean1(d.cmdref)?' — commande n° '+clean1(d.cmdref):''}`;
const RETRACT={
 key:'attest_retract_v1',title:'Lettre de rétractation',sub:'14 jours pour changer d’avis',
 init:x=>{if(!x.le)x.le=today;if(!x.rtype)x.rtype='bien';if(!x.canal)x.canal='distance'},
 steps:[
  {t:'Avant de commencer',pre:()=>`<div class="note"><p><b>À quoi sert cette lettre ?</b> Après un achat <b>à distance</b> (internet, téléphone, catalogue) ou <b>hors établissement</b> (démarchage à domicile, sur le lieu de travail…), vous avez en principe <b>14 jours</b> pour changer d’avis, sans donner de raison (article L. 221-18 du code de la consommation).</p></div>
 <div class="note warn"><ul>
  <li>Pour un bien, le délai court à partir de sa <b>réception</b> ; pour un service, à partir de la <b>conclusion du contrat</b>.</li>
  <li>Pas de rétractation, notamment, pour : les biens faits sur mesure ou personnalisés, les denrées périssables, les produits descellés qui ne peuvent être renvoyés pour des raisons d’hygiène, les contenus numériques déjà fournis avec votre accord, les voyages et hébergements à date fixe, les services pleinement exécutés avec votre accord (article L. 221-28). <b>Pas de rétractation non plus pour un achat sur une foire ou un salon.</b></li>
  <li>Les frais de renvoi du bien peuvent rester à votre charge si le vendeur vous en a informé.</li>
  <li><b>Envoyez la lettre en recommandé avec accusé de réception</b> avant la date limite : c’est la date d’envoi qui compte, gardez la preuve.</li></ul></div>`,fields:[]},
  {t:'Votre achat',fields:[
   {k:'canal',l:'Comment avez-vous acheté ?',ty:'radio',o:[['distance','À distance (internet, téléphone, courrier)'],['domicile','Lors d’un démarchage (domicile, travail…)']]},
   {k:'rtype',l:'Il s’agit…',ty:'radio',o:[['bien','D’un bien (objet livré)'],['service','D’un service (abonnement, prestation, formation…)']]},
   {k:'cmd',l:'Ce que vous avez acheté',ty:'text',h:'Exemple : « un aspirateur Dyson V15 », « un abonnement de 12 mois à… ».'},
   {k:'cmdref',l:'N° de commande ou de contrat',ty:'text',h:'Facultatif, mais conseillé.'},
   {row:[{k:'cdate',l:'Date de la commande / du contrat',ty:'date'},{k:'recep',l:'Date de réception',ty:'date'}],if:x=>x.rtype!=='service'},
   {k:'cdate',l:'Date de conclusion du contrat',ty:'date',if:x=>x.rtype==='service'},
   {k:'prix',l:'Montant payé (€)',ty:'text',h:'Facultatif.'}],
   post:()=>`<div id="rinfo">${retractInfo().html}</div>`,live:['cdate','recep'],liveFn:()=>{const c=$('#rinfo');if(c)c.innerHTML=retractInfo().html}},
  {t:'Vous',fields:SENDER()},
  {t:'Le vendeur',fields:RECIP('du vendeur (société)','Exemple : « Boulanger SA », « SFR ».')},
  letterSigStep(),
  {t:'Votre lettre',recap:1,fields:[]}
 ],
 recapSkip:[],recapMore:()=>[],
 recapBefore:()=>retractInfo().html+letterPreview(retractObjet(),retractParas()),
 missing(){const m=letterMissing();if(!clean1(d.cmd))m.unshift('ce que vous avez acheté');if(!rStart())m.unshift(d.rtype==='service'?'date du contrat':'date de réception');return m},
 missWarn:'Vous pouvez quand même produire le PDF, mais complétez ces informations avant de l’envoyer.',
 mailHint:'service client du vendeur',
 recapAfter:lrarNote,
 fname:()=>`Retractation${fnDest()}_${d.le||today}.pdf`,
 mail(){return {to:clean1(d.mailto),subj:retractObjet(),body:`Madame, Monsieur,\n\nVeuillez trouver ci-joint ma lettre de rétractation, qui vous est également adressée par courrier recommandé avec accusé de réception.\n\n${fullName()}`}},
 build(){return letterPDF({objet:retractObjet(),paras:retractParas()})}
};

/* ================= Document 7 : lettre de résiliation ================= */
const RTYPES=[['box','Box internet'],['mobile','Forfait mobile'],['auto','Assurance auto'],['habitation','Assurance habitation'],['mutuelle','Mutuelle santé'],['sport','Salle de sport'],['autre','Autre contrat']];
const isAssur=()=>['auto','habitation','mutuelle'].includes(d.ctype);
const isTel=()=>['box','mobile'].includes(d.ctype);
function resilNote(){
 const t=d.ctype;let p='';
 if(isTel())p=`<p><b>Box et mobile :</b> la résiliation prend effet au plus tard <b>10 jours</b> après la réception de votre lettre, sauf si vous demandez une date plus tardive (article L. 224-39 du code de la consommation). Si vous êtes encore dans une <b>période d’engagement</b>, des frais peuvent être dus : en général, les mensualités restantes la 1<sup>re</sup> année, puis le quart des mensualités restantes la 2<sup>e</sup> année. ${t==='box'?'Pensez à rendre la box et le décodeur.':''} Si vous changez seulement d’opérateur mobile en gardant votre numéro, le nouvel opérateur s’occupe de tout avec le code RIO : pas besoin de lettre.</p>`;
 else if(isAssur())p=`<p><b>Assurances et mutuelles :</b> après <b>un an</b> de contrat, vous pouvez résilier <b>à tout moment</b>, sans frais ; la résiliation prend effet un mois après la réception de votre demande (article L. 113-15-2 du code des assurances, article L. 221-10-2 du code de la mutualité pour une mutuelle). Avant un an, il faut en principe attendre l’échéance annuelle, sauf changement de situation prévu par la loi (déménagement, mariage, retraite…).${t!=='mutuelle'?' Pour une assurance auto ou l’assurance habitation d’un locataire, c’est souvent le <b>nouvel assureur</b> qui fait la démarche pour vous.':''} Si l’avis d’échéance vous est arrivé tard ou pas du tout, vous pouvez aussi résilier à l’échéance (loi Chatel).</p>`;
 else if(t==='sport')p=`<p><b>Salle de sport :</b> les conditions dépendent de votre contrat (durée d’engagement, préavis, motifs légitimes comme un déménagement ou un problème de santé). Pour un contrat à reconduction tacite, le professionnel doit vous rappeler la date limite pour ne pas le renouveler (loi Chatel, article L. 215-1 du code de la consommation).</p>`;
 else if(t)p=`<p>Vérifiez dans votre contrat la durée d’engagement et le préavis. Pour un contrat à reconduction tacite, le professionnel doit vous rappeler la date limite pour ne pas le renouveler (loi Chatel, article L. 215-1 du code de la consommation).</p>`;
 return p?`<div class="note">${p}<p>Si vous avez souscrit en ligne, le professionnel doit aussi proposer une <b>résiliation en ligne</b> en quelques clics (fonction « résilier votre contrat »).</p></div>`:'';
}
const ctLabel=()=>d.ctype==='autre'?(clean1(d.autretype)||'contrat'):(RTYPES.find(x=>x[0]===d.ctype)||[,'contrat'])[1].toLowerCase();
function resilParas(){
 const L=[],ids=[clean1(d.numcontrat)&&`n° ${clean1(d.numcontrat)}`,clean1(d.numclient)&&`n° client ${clean1(d.numclient)}`].filter(Boolean).join(', ');
 L.push(`Par la présente, je vous informe de ma décision de résilier mon contrat ${ctLabel()}${ids?` (${ids})`:''}${clean1(d.titulaire)?`, souscrit au nom de ${clean1(d.titulaire)}`:''}.`);
 if(isAssur()&&d.anc==='plus')L.push(`Ce contrat ayant été souscrit il y a plus d’un an, je le résilie en application de ${d.ctype==='mutuelle'?'l’article L. 221-10-2 du code de la mutualité (ou, selon votre organisme, de l’article L. 113-15-2 du code des assurances ou L. 932-21-1 du code de la sécurité sociale)':'l’article L. 113-15-2 du code des assurances'}. La résiliation prend effet un mois après la réception de la présente lettre.`);
 else if(isAssur()&&d.effet==='echeance')L.push(`Je vous demande de prendre en compte cette résiliation à la prochaine échéance annuelle du contrat.`);
 if(isTel())L.push(`Conformément à l’article L. 224-39 du code de la consommation, cette résiliation doit prendre effet au plus tard dix jours après la réception de la présente lettre${d.effet==='date'&&d.effetdate?`, et je souhaite qu’elle prenne effet le ${fr(d.effetdate)}`:''}.`);
 if(!(isAssur()&&d.anc==='plus')&&!isTel()&&!(isAssur()&&d.effet==='echeance')){
  if(d.effet==='date'&&d.effetdate)L.push(`Je souhaite que cette résiliation prenne effet le ${fr(d.effetdate)}, ou à défaut à la première date possible compte tenu du préavis prévu au contrat.`);
  else if(d.effet==='echeance')L.push(`Je vous demande de prendre en compte cette résiliation à la prochaine échéance du contrat.`);
  else L.push(`Je vous remercie de prendre en compte cette résiliation dans les meilleurs délais, dans le respect du préavis prévu au contrat.`);
 }
 if(clean1(d.motif))L.push(`Motif : ${clean1(d.motif)}.`);
 if(d.ctype==='box')L.push(`Merci de m’indiquer les modalités de restitution du matériel (box, décodeur).`);
 L.push(`Je vous remercie de m’adresser une confirmation écrite de cette résiliation précisant sa date d’effet, et de cesser tout prélèvement après cette date${isAssur()?'. Le cas échéant, je vous remercie de me rembourser la part de cotisation correspondant à la période non couverte':''}.`);
 return L;
}
const resilObjet=()=>`Résiliation de mon contrat ${ctLabel()}${clean1(d.numcontrat)?' n° '+clean1(d.numcontrat):''}`;
const RESIL={
 key:'attest_resil_v1',title:'Lettre de résiliation',sub:'Box, mobile, assurance, mutuelle, salle de sport…',
 init:x=>{if(!x.le)x.le=today;if(!x.effet)x.effet='asap'},
 steps:[
  {t:'Avant de commencer',pre:()=>`<div class="note"><p><b>À quoi sert cette lettre ?</b> À mettre fin à un contrat (box, mobile, assurance, mutuelle, salle de sport…) en gardant une preuve de la date de votre demande.</p></div>
 <div class="note warn"><ul>
  <li>Vérifiez d’abord votre contrat : durée d’engagement, préavis, adresse à utiliser pour résilier.</li>
  <li>Beaucoup de contrats peuvent aussi être résiliés en ligne (« résilier votre contrat » sur le site), ce qui est aussi valable.</li>
  <li>Les règles changent selon le contrat : l’appli rappelle les principales, sans remplacer la lecture de vos conditions générales.</li></ul></div>`,fields:[]},
  {t:'Quel contrat ?',fields:[{k:'ctype',l:'Vous voulez résilier…',ty:'radio',o:RTYPES},{k:'autretype',l:'Quel contrat ?',ty:'text',h:'Exemple : « abonnement au magazine X ».',if:x=>x.ctype==='autre',sub:1}],post:resilNote},
  {t:'Votre contrat',fields:[
   {row:[{k:'numcontrat',l:'N° de contrat ou de ligne',ty:'text'},{k:'numclient',l:'N° client',ty:'text',h:'Facultatif'}]},
   {k:'titulaire',l:'Titulaire du contrat, si ce n’est pas vous',ty:'text',h:'Facultatif.'},
   {k:'anc',l:'Votre contrat a-t-il plus d’un an ?',ty:'radio',o:[['plus','Oui, plus d’un an'],['moins','Non, moins d’un an'],['nsp','Je ne sais pas']],if:()=>isAssur()},
   {k:'effet',l:'Date d’effet souhaitée',ty:'radio',o:[['asap','Le plus tôt possible'],['date','À une date précise'],['echeance','À la prochaine échéance']]},
   {k:'effetdate',l:'Date souhaitée',ty:'date',if:x=>x.effet==='date',sub:1},
   {k:'motif',l:'Motif',ty:'text',h:'Facultatif : en général, vous n’avez pas à donner de motif. Utile pour un motif légitime (déménagement, perte d’emploi, santé…).'}]},
  {t:'Vous',fields:SENDER()},
  {t:'L’organisme',fields:RECIP('de l’opérateur, de l’assureur ou de la société','Exemple : « Free », « MAIF », « Basic-Fit ».')},
  letterSigStep(),
  {t:'Votre lettre',recap:1,fields:[]}
 ],
 recapSkip:[],recapMore:()=>[],
 recapBefore:()=>letterPreview(resilObjet(),resilParas()),
 missing(){const m=letterMissing();if(!d.ctype)m.unshift('type de contrat');if(!clean1(d.numcontrat)&&!clean1(d.numclient))m.unshift('n° de contrat ou de client');return m},
 missWarn:'Vous pouvez quand même produire le PDF, mais complétez ces informations avant de l’envoyer.',
 mailHint:'service résiliation de l’organisme',
 recapAfter:lrarNote,
 fname:()=>`Resiliation${fnDest()}_${d.le||today}.pdf`,
 mail(){return {to:clean1(d.mailto),subj:resilObjet(),body:`Madame, Monsieur,\n\nVeuillez trouver ci-joint ma lettre de résiliation, qui vous est également adressée par courrier recommandé avec accusé de réception.\n\n${fullName()}`}},
 build(){return letterPDF({objet:resilObjet(),paras:resilParas()})}
};

/* ================= Document 8 : indemnisation vol retardé, annulé ou surréservé (CE 261/2004) ================= */
// Petite table d'aéroports : code, ville, latitude, longitude, 1 = zone du règlement (UE, outre-mer, Suisse, Norvège, Islande)
const AIRPORTS=[['CDG','Paris',49.0097,2.5479,1],['ORY','Paris-Orly',48.7262,2.3652,1],['BVA','Beauvais',49.4544,2.1128,1],['MRS','Marseille',43.4393,5.2214,1],['NCE','Nice',43.6584,7.2159,1],['LYS','Lyon',45.7256,5.0811,1],['TLS','Toulouse',43.6291,1.3638,1],['BOD','Bordeaux',44.8283,-0.7156,1],['NTE','Nantes',47.1532,-1.6107,1],['LIL','Lille',50.5619,3.0894,1],['MPL','Montpellier',43.5762,3.963,1],['SXB','Strasbourg',48.5383,7.6282,1],['BSL','Bâle-Mulhouse',47.59,7.5292,1],['BES','Brest',48.4479,-4.4185,1],['BIQ','Biarritz',43.4684,-1.5233,1],['AJA','Ajaccio',41.9236,8.8029,1],['BIA','Bastia',42.5527,9.4837,1],
 ['PTP','Pointe-à-Pitre',16.2653,-61.5318,1],['FDF','Fort-de-France',14.591,-61.0032,1],['RUN','La Réunion',20.8871*-1,55.5103,1],['CAY','Cayenne',4.8198,-52.3604,1],['DZA','Mayotte',-12.8047,45.2811,1],
 ['MAD','Madrid',40.4719,-3.5626,1],['BCN','Barcelone',41.2974,2.0833,1],['PMI','Palma',39.5517,2.7388,1],['LIS','Lisbonne',38.7742,-9.1342,1],['OPO','Porto',41.2481,-8.6814,1],['FAO','Faro',37.0144,-7.9659,1],['FCO','Rome',41.8003,12.2389,1],['MXP','Milan',45.6306,8.7281,1],['VCE','Venise',45.5053,12.3519,1],['NAP','Naples',40.886,14.2908,1],['AMS','Amsterdam',52.3105,4.7683,1],['BRU','Bruxelles',50.9014,4.4844,1],['CRL','Charleroi',50.4592,4.4538,1],['FRA','Francfort',50.0379,8.5622,1],['MUC','Munich',48.3538,11.7861,1],['BER','Berlin',52.3667,13.5033,1],['DUB','Dublin',53.4213,-6.2701,1],['ATH','Athènes',37.9364,23.9445,1],['VIE','Vienne',48.1103,16.5697,1],['CPH','Copenhague',55.618,12.656,1],['ARN','Stockholm',59.6519,17.9186,1],['PRG','Prague',50.1008,14.26,1],['WAW','Varsovie',52.1657,20.9671,1],['BUD','Budapest',47.4298,19.2611,1],['HEL','Helsinki',60.3172,24.9633,1],['GVA','Genève',46.2381,6.109,1],['ZRH','Zurich',47.4647,8.5492,1],['OSL','Oslo',60.1976,11.1004,1],['KEF','Reykjavik',63.985,-22.6056,1],
 ['LHR','Londres-Heathrow',51.47,-0.4543,0],['LGW','Londres-Gatwick',51.1537,-0.1821,0],['STN','Londres-Stansted',51.885,0.235,0],['RAK','Marrakech',31.6069,-8.0363,0],['CMN','Casablanca',33.3675,-7.5898,0],['TUN','Tunis',36.851,10.2272,0],['DJE','Djerba',33.875,10.7755,0],['ALG','Alger',36.691,3.2154,0],['IST','Istanbul',41.2753,28.7519,0],['DXB','Dubaï',25.2532,55.3657,0],['JFK','New York',40.6413,-73.7781,0],['YUL','Montréal',45.4706,-73.7408,0],['DSS','Dakar',14.67,-17.073,0],['ABJ','Abidjan',5.2614,-3.9263,0],['CAI','Le Caire',30.1219,31.4056,0],['BKK','Bangkok',13.69,100.7501,0]];
const findAirport=s=>{const t=clean1(s);if(!t)return null;const code=(t.toUpperCase().match(/\b[A-Z]{3}\b/g)||[]).map(c=>AIRPORTS.find(a=>a[0]===c)).find(Boolean);if(code)return code;
 const N=x=>x.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[-’']/g,' ');const n=N(t);
 return AIRPORTS.filter(a=>n.includes(N(a[1]))).sort((x,y)=>y[1].length-x[1].length)[0]||AIRPORTS.find(a=>n.includes(N(a[1]).split(' ')[0]))||null};
const gcKm=(a,b)=>{const R=6371,r=Math.PI/180,dl=(b[2]-a[2])*r,dg=(b[3]-a[3])*r,x=Math.sin(dl/2)**2+Math.cos(a[2]*r)*Math.cos(b[2]*r)*Math.sin(dg/2)**2;return Math.round(2*R*Math.asin(Math.sqrt(x)))};
function volCalc(){
 const A=findAirport(d.dep),B=findAirport(d.arr),auto=A&&B?gcKm(A,B):null;
 const dist=num(d.dist)>0?num(d.dist):auto;
 const intra=A&&B?!!(A[4]&&B[4]):d.intraue==='oui';
 const depZone=A?!!A[4]:null;
 const nb=Math.max(1,parseInt(d.nbpax)||1);
 let base=0,why='',ok=true,half=false;
 if(dist)base=dist<=1500?250:(intra||dist<=3500)?400:600;
 const lim=dist<=1500?2:(intra||dist<=3500)?3:4;
 const h=num(d.retard);
 if(d.pb==='retard'){if(!(h>=3)){ok=false;why='Un retard de moins de 3 heures à l’arrivée ne donne pas droit à une indemnisation.'}else if(dist>3500&&!intra&&h<4)half=true}
 else if(d.pb==='annule'){const rr=num(d.reachretard);if(d.prevenu==='plus14'){ok=false;why='Prévenu plus de 14 jours avant le départ : pas d’indemnisation en principe (seulement le remboursement ou un autre vol).'}else if(d.reach==='oui'&&rr>=0&&((d.prevenu==='moins7'&&rr<2)||(d.prevenu==='7a14'&&rr<4))){ok=false;why=d.prevenu==='moins7'?'Prévenu moins de 7 jours avant et réacheminé avec moins de 2 h de retard à l’arrivée : pas d’indemnisation en principe, si l’autre vol ne partait pas plus d’1 h avant le vôtre (article 5 du règlement).':'Prévenu 7 à 14 jours avant et réacheminé avec moins de 4 h de retard à l’arrivée : pas d’indemnisation en principe, si l’autre vol ne partait pas plus de 2 h avant le vôtre (article 5 du règlement).'}else if(d.reach==='oui'&&num(d.reachretard)>=0&&num(d.reachretard)<=lim)half=true}
 else if(d.pb==='refus'){if(d.reach==='oui'&&num(d.reachretard)>=0&&num(d.reachretard)<=lim)half=true}
 const each=ok&&dist?(half?base/2:base):0;
 return {A,B,auto,dist,intra,depZone,nb,base,each,total:each*nb,ok,why,half,lim,eachS:eur(each),totalS:eur(each*nb)};
}
function volInfo(){
 const c=volCalc();let h='';
 if(c.auto)h+=`<p>Distance estimée entre ${esc(c.A[1])} (${c.A[0]}) et ${esc(c.B[1])} (${c.B[0]}) : <b>${c.auto.toLocaleString('fr-FR')} km</b>${c.intra?' (vol dans la zone européenne)':''}.</p>`;
 else if(!num(d.dist))h+=`<p>Aéroports non reconnus : indiquez la distance en kilomètres (un site de calcul de distance entre aéroports vous la donne).</p>`;
 if(c.depZone===false)h+=`<p><b>Départ hors de l’Union européenne :</b> le règlement ne s’applique que si la compagnie est européenne (Air France, Transavia, easyJet Europe…).</p>`;
 if(!d.pb)h+=`<p>Choisissez le problème rencontré à l’étape 2.</p>`;
 else if(!c.ok)h+=`<p><b>${esc(c.why)}</b></p>`;
 else if(c.dist)h+=`<p><b>Indemnisation estimée : ${c.eachS} par passager${c.nb>1?`, soit ${c.totalS} pour ${c.nb} passagers`:''}</b>${c.half?' (montant réduit de moitié, compte tenu du retard à l’arrivée)':''}.</p>`;
 return h?`<div class="note">${h}<p style="font-size:13px;color:var(--mute)">Montant indicatif, selon le règlement (CE) n° 261/2004.</p></div>`:'';
}
function volParas(){
 const c=volCalc(),L=[],pax=clean1(d.paxnoms);
 L.push(`J’avais une réservation confirmée${clean1(d.resa)?` (référence ${clean1(d.resa)})`:''} sur le vol ${clean1(d.volno)||'…'} de ${clean1(d.cie)||'votre compagnie'} du ${fr(d.vdate)||'…'}, de ${clean1(d.dep)||'…'} à ${clean1(d.arr)||'…'}, pour ${c.nb} passager${c.nb>1?'s':''}${pax?` (${pax})`:''}.`);
 if(d.pb==='retard')L.push(`Ce vol est arrivé à destination avec un retard d’environ ${clean1(d.retard)||'…'} heures par rapport à l’heure d’arrivée prévue.`);
 else if(d.pb==='annule')L.push(`Ce vol a été annulé${d.prevenu==='moins7'?' et j’en ai été informé moins de sept jours avant le départ':d.prevenu==='7a14'?' et j’en ai été informé entre sept et quatorze jours avant le départ':''}.${d.reach==='oui'?` J’ai été réacheminé et suis arrivé à destination avec environ ${clean1(d.reachretard)||'…'} heures de retard.`:''}`);
 else L.push(`L’embarquement m’a été refusé contre ma volonté, alors que je m’étais présenté à l’enregistrement dans les délais.${d.reach==='oui'?` J’ai été réacheminé et suis arrivé à destination avec environ ${clean1(d.reachretard)||'…'} heures de retard.`:''}`);
 const art=d.pb==='refus'?'des articles 4 et 7':d.pb==='annule'?'des articles 5 et 7':'de l’article 7';
 L.push(`En application ${art} du règlement (CE) n° 261/2004${d.pb==='retard'?', tel qu’interprété par la Cour de justice de l’Union européenne (arrêt Sturgeon du 19 novembre 2009, affaires C-402/07 et C-432/07)':''}, et compte tenu d’une distance d’environ ${c.dist?c.dist.toLocaleString('fr-FR'):'…'} km, je vous demande de me verser une indemnisation forfaitaire de ${c.each?c.eachS:'…'} par passager, soit ${c.each?c.totalS:'…'} au total.`);
 if(d.pb!=='refus')L.push(`Cette indemnisation ne pourrait être écartée que si vous prouviez que ${d.pb==='retard'?'le retard est dû':'l’annulation est due'} à des circonstances extraordinaires qui n’auraient pas pu être évitées même si toutes les mesures raisonnables avaient été prises (article 5, paragraphe 3, du règlement).`);
 L.push(`Je vous remercie de procéder à ce versement dans un délai d’un mois à compter de la réception de la présente demande. À défaut de réponse satisfaisante dans un délai de deux mois, je saisirai le Médiateur Tourisme et Voyage, puis, si nécessaire, la juridiction compétente.`);
 return L;
}
const volObjet=()=>`Demande d’indemnisation — vol ${clean1(d.volno)||'…'} du ${fr(d.vdate)||'…'} (règlement (CE) n° 261/2004)`;
const VOL={
 key:'attest_vol_v1',title:'Indemnisation vol',sub:'Vol retardé, annulé ou surréservé',
 init:x=>{if(!x.le)x.le=today;if(!x.nbpax)x.nbpax='1'},
 maxPh:4,phLabels:[],
 phIntro:()=>`<p>Joignez si possible la <b>confirmation de réservation</b> et les <b>cartes d’embarquement</b> (ou une capture d’écran), ainsi que tout message de la compagnie sur le retard ou l’annulation.</p><p>Les photos sont ajoutées à la fin du PDF (4 au maximum).</p>`,
 phBtn:n=>n?'Ajouter une autre pièce':'Photographier la réservation ou la carte d’embarquement',
 steps:[
  {t:'Avant de commencer',pre:()=>`<div class="note"><p><b>À quoi sert cette lettre ?</b> Le règlement européen n° 261/2004 prévoit une <b>indemnisation forfaitaire de 250 à 600 € par passager</b> en cas de vol annulé, de refus d’embarquement (surréservation) ou d’arrivée avec <b>au moins 3 heures de retard</b>.</p></div>
 <div class="note warn"><ul>
  <li>Le règlement s’applique aux vols qui partent d’un aéroport de l’Union européenne (et de Suisse, Norvège, Islande), et aux vols qui y arrivent sur une compagnie européenne.</li>
  <li>Montant selon la distance : <b>250 €</b> jusqu’à 1 500 km ; <b>400 €</b> de 1 500 à 3 500 km (ou au-delà de 1 500 km dans l’UE) ; <b>600 €</b> au-delà de 3 500 km. Il peut être réduit de moitié dans certains cas de réacheminement.</li>
  <li>Pas d’indemnisation si la compagnie prouve des <b>circonstances extraordinaires</b> (météo dangereuse, grève du contrôle aérien…), ni pour une annulation annoncée plus de 14 jours avant.</li>
  <li>Beaucoup de compagnies demandent de passer par leur <b>formulaire en ligne</b> : vous pouvez y joindre ce PDF. Sans réponse sous 2 mois, saisissez le <b>Médiateur Tourisme et Voyage</b> (mtv.travel), gratuit.</li></ul></div>`,fields:[]},
  {t:'Le problème',fields:[
   {k:'pb',l:'Qu’est-il arrivé ?',ty:'radio',o:[['retard','Vol retardé'],['annule','Vol annulé'],['refus','Refus d’embarquement (surréservation)']]},
   {k:'prevenu',l:'Quand avez-vous été prévenu de l’annulation ?',ty:'radio',o:[['moins7','Moins de 7 jours avant le départ'],['7a14','Entre 7 et 14 jours avant'],['plus14','Plus de 14 jours avant']],if:x=>x.pb==='annule'},
   {k:'reach',l:'La compagnie vous a-t-elle mis sur un autre vol ?',ty:'radio',o:YN,if:x=>x.pb==='annule'||x.pb==='refus'},
   {k:'reachretard',l:'Retard à l’arrivée avec cet autre vol (en heures)',ty:'text',h:'Par rapport à l’heure d’arrivée de votre vol initial. Exemple : 2,5',if:x=>(x.pb==='annule'||x.pb==='refus')&&x.reach==='oui',sub:1},
   {k:'retard',l:'Retard à l’arrivée (en heures)',ty:'text',h:'C’est l’heure d’ouverture des portes à l’arrivée qui compte. Exemple : 3,5',if:x=>x.pb==='retard'}]},
  {t:'Le vol',fields:[
   {row:[{k:'cie',l:'Compagnie',ty:'text'},{k:'volno',l:'N° de vol',ty:'text',h:'Exemple : AF1234'}]},
   {row:[{k:'vdate',l:'Date du vol',ty:'date'},{k:'resa',l:'Réf. de réservation',ty:'text',h:'Facultatif'}]},
   {row:[{k:'dep',l:'Aéroport de départ',ty:'text',h:'Ville ou code (ex. CDG, MRS)'},{k:'arr',l:'Aéroport d’arrivée',ty:'text',h:'Ville ou code'}]},
   {k:'dist',l:'Distance (km)',ty:'text',h:'Facultatif si les aéroports sont reconnus : la distance est calculée.'},
   {k:'intraue',l:'Les deux aéroports sont-ils dans l’Union européenne ?',ty:'radio',o:YN,if:()=>!(findAirport(d.dep)&&findAirport(d.arr))}],
   post:()=>`<div id="vinfo">${volInfo()}</div>`,live:['dep','arr','dist','retard','reachretard','nbpax'],liveFn:()=>{const c=$('#vinfo');if(c)c.innerHTML=volInfo()}},
  {t:'Les passagers',fields:[
   {k:'nbpax',l:'Nombre de passagers concernés',ty:'tel'},
   {k:'paxnoms',l:'Noms des passagers',ty:'text',h:'Exemple : « moi-même, Léa et Tom MARTIN ».'}],post:()=>`<div id="vinfo2">${volInfo()}</div>`,live:['nbpax'],liveFn:()=>{const c=$('#vinfo2');if(c)c.innerHTML=volInfo()}},
  {t:'Vous',fields:SENDER()},
  {t:'La compagnie',fields:RECIP('de la compagnie','Exemple : « Air France — Service client ».')},
  {t:'Pièces jointes',photos:1,pre:()=>photosHTML(),recapRows:()=>[['Pièces jointes',phCount()]],fields:[]},
  letterSigStep(),
  {t:'Votre lettre',recap:1,fields:[]}
 ],
 recapSkip:[],recapMore:()=>[],
 recapBefore:()=>volInfo()+letterPreview(volObjet(),volParas()),
 missing(){const m=letterMissing(),c=volCalc();if(!d.pb)m.unshift('problème rencontré');if(!d.volno||!d.vdate)m.unshift('n° et date du vol');if(!c.dist)m.unshift('distance');return m},
 missWarn:'Vous pouvez quand même produire le PDF, mais complétez ces informations avant de l’envoyer.',
 mailHint:'service client de la compagnie',
 recapAfter:()=>`<div class="note" style="margin-top:16px"><p><b>Pour l’envoyer :</b> passez par le formulaire de réclamation de la compagnie en y joignant ce PDF, ou envoyez-le en <b>lettre recommandée avec accusé de réception</b>. Sans réponse satisfaisante sous 2 mois, saisissez gratuitement le Médiateur Tourisme et Voyage (mtv.travel).</p></div>`,
 fname:()=>`Indemnisation_vol_${fnPart(d.volno)||'vol'}_${d.le||today}.pdf`,
 mail(){return {to:clean1(d.mailto),subj:volObjet(),body:`Madame, Monsieur,\n\nVeuillez trouver ci-joint ma demande d’indemnisation au titre du règlement (CE) n° 261/2004, avec les justificatifs.\n\n${fullName()}`}},
 build(){return letterPDF({objet:volObjet(),paras:volParas(),pj:myPh().length?'Pièces jointes : réservation, cartes d’embarquement et justificatifs.':'',ph:myPh(),annexTitle:'Pièces jointes : réservation et cartes d’embarquement',rec:false})}
};

/* ================= Document 9 : préavis de départ du locataire ================= */
const addMonths=(iso,n)=>{const t=isoD(iso);if(!t)return null;const y=t.getUTCFullYear(),m=t.getUTCMonth()+n,dd=t.getUTCDate();const last=new Date(Date.UTC(y,m+1,0)).getUTCDate();return isoS(new Date(Date.UTC(y,m,Math.min(dd,last))))};
const MOTIFS=[['aucun','Pas de motif particulier'],['zone','Logement en zone tendue'],['mutation','Mutation professionnelle'],['perte','Perte d’emploi'],['nouvel','Nouvel emploi après une perte d’emploi'],['premier','Premier emploi'],['sante','État de santé justifiant un changement de domicile'],['rsa','Bénéficiaire du RSA ou de l’AAH'],['social','Attribution d’un logement social']];
const MOTIF_TXT={zone:'le logement étant situé dans une zone d’urbanisation où il existe un déséquilibre marqué entre l’offre et la demande de logements (« zone tendue »)',mutation:'en raison de ma mutation professionnelle',perte:'en raison de la perte de mon emploi',nouvel:'en raison de l’obtention d’un nouvel emploi consécutif à une perte d’emploi',premier:'en raison de l’obtention de mon premier emploi',sante:'mon état de santé justifiant un changement de domicile',rsa:'étant bénéficiaire du revenu de solidarité active (ou de l’allocation aux adultes handicapés)',social:'en raison de l’attribution d’un logement social'};
const ZT_URL='https://www.service-public.gouv.fr/simulateur/calcul/zones-tendues';
function preavisCalc(){
 const meuble=d.meuble==='oui',motif=meuble?'aucun':(d.motif||'aucun');
 const mois=meuble||motif!=='aucun'?1:3;
 return {meuble,motif,mois,fin:addMonths(d.recep,mois),justif:!meuble&&motif!=='aucun'&&motif!=='zone'};
}
function preavisInfo(){
 const c=preavisCalc();
 return `<div class="note"><p><b>Votre préavis : ${c.mois} mois</b>${c.meuble?' (logement meublé)':c.motif!=='aucun'?' (préavis réduit)':' (logement vide, sans motif de réduction)'}.</p>${c.fin?`<p>Si votre propriétaire reçoit la lettre le ${esc(fr(d.recep))}, le préavis se termine le <b>${esc(frLong(c.fin))}</b> à minuit. Vous payez le loyer jusqu’à cette date (sauf si un nouveau locataire arrive plus tôt avec l’accord du propriétaire).</p>`:''}${c.justif?'<p><b>Joignez un justificatif</b> de votre situation (étape 5), sinon le préavis redevient de 3 mois.</p>':''}</div>`;
}
const preavisHead=()=>d.mode==='main'?'Lettre remise en main propre contre émargement':d.mode==='cdj'?'Congé signifié par commissaire de justice':'Lettre recommandée avec accusé de réception';
function preavisParas(){
 const c=preavisCalc(),L=[];
 L.push(`Par la présente, je vous donne congé du logement${c.meuble?' meublé':''} que je loue ${clean1(d.logadr)?'au '+clean1(d.logadr):'à l’adresse ci-dessus'}${d.baildate?`, en vertu du bail signé le ${fr(d.baildate)}`:''}.`);
 if(c.meuble)L.push(`S’agissant d’un logement meublé, le délai de préavis est d’un mois (article 25-8 de la loi n° 89-462 du 6 juillet 1989).`);
 else if(c.motif!=='aucun')L.push(`Conformément à l’article 15 de la loi n° 89-462 du 6 juillet 1989, mon délai de préavis est réduit à un mois, ${MOTIF_TXT[c.motif]}.${c.justif?' Vous trouverez ci-joint le justificatif correspondant.':''}`);
 else L.push(`Conformément à l’article 15 de la loi n° 89-462 du 6 juillet 1989, le délai de préavis est de trois mois.`);
 L.push(`Ce délai court à compter de la réception de la présente lettre${c.fin?` ; il prendra donc fin le ${fr(c.fin)} si vous la recevez le ${fr(d.recep)}`:''}.`);
 L.push(`Je vous propose de convenir ensemble de la date de l’état des lieux de sortie et de la remise des clés. Je vous remercie de me restituer le dépôt de garantie dans les délais prévus par l’article 22 de la même loi${clean1(d.newadr)?`, à ma nouvelle adresse : ${clean1(d.newadr)}`:''}.`);
 return L;
}
const PREAVIS={
 key:'attest_preavis_v1',title:'Préavis de départ',sub:'Le locataire donne congé de son logement',
 init:x=>{if(!x.le)x.le=today;if(!x.meuble)x.meuble='non';if(!x.motif)x.motif='aucun';if(!x.mode)x.mode='lrar';if(!x.recep)x.recep=isoS(new Date(isoD(today).getTime()+3*864e5))},
 maxPh:3,phLabels:[],phIntro:()=>`<p>Pour un préavis réduit, joignez le <b>justificatif</b> de votre situation : attestation de l’employeur, lettre de licenciement, attestation Pôle emploi / France Travail, certificat médical, attestation CAF (RSA, AAH), attribution du logement social…</p><p>Les photos sont ajoutées à la fin du PDF (3 au maximum). Pour une zone tendue, aucun justificatif n’est demandé.</p>`,
 phBtn:n=>n?'Ajouter une autre page':'Photographier le justificatif',
 steps:[
  {t:'Avant de commencer',pre:()=>`<div class="note"><p><b>À quoi sert cette lettre ?</b> Le locataire qui veut quitter son logement doit donner congé à son propriétaire (ou à l’agence) en respectant un délai de <b>préavis</b>.</p></div>
 <div class="note warn"><ul>
  <li>Logement vide : <b>3 mois</b>, réduits à <b>1 mois</b> en zone tendue ou dans certains cas (mutation, perte d’emploi, nouvel emploi après une perte d’emploi, premier emploi, état de santé, RSA ou AAH, logement social). Logement meublé : <b>1 mois</b>.</li>
  <li>Le préavis court à partir de la <b>réception</b> de la lettre par le propriétaire : lettre recommandée avec accusé de réception, acte de commissaire de justice, ou remise en main propre contre émargement.</li>
  <li>Si plusieurs locataires ont signé le bail, chacun doit en principe donner congé.</li></ul></div>`,fields:[]},
  {t:'Votre logement',fields:[
   {k:'logadr',l:'Adresse du logement loué',ty:'text',h:'Avec l’étage ou le n° d’appartement.'},
   {k:'baildate',l:'Date de signature du bail',ty:'date',h:'Facultatif.'},
   {k:'meuble',l:'Le logement est-il loué meublé ?',ty:'radio',o:YN},
   {k:'motif',l:'Motif de préavis réduit (1 mois)',ty:'radio',o:MOTIFS,if:x=>x.meuble!=='oui',h:`Zone tendue ? Vérifiez avec le <a href="${ZT_URL}" target="_blank" rel="noopener">simulateur officiel de service-public.fr</a>.`}],
   post:()=>`<div id="pinfo">${preavisInfo()}</div>`},
  {t:'Envoi de la lettre',fields:[
   {k:'mode',l:'Comment allez-vous la remettre ?',ty:'radio',o:[['lrar','Lettre recommandée avec accusé de réception'],['main','En main propre, contre signature'],['cdj','Par commissaire de justice']]},
   {k:'recep',l:'Date à laquelle le propriétaire la recevra (prévue)',ty:'date',h:'En recommandé, c’est la date de première présentation : comptez 2 à 3 jours après l’envoi. En main propre, c’est la date de remise.'},
   {k:'newadr',l:'Votre future adresse',ty:'text',h:'Facultatif : pour la restitution du dépôt de garantie.'}],
   post:()=>`<div id="pinfo2">${preavisInfo()}</div>`,live:['recep'],liveFn:()=>{const c=$('#pinfo2');if(c)c.innerHTML=preavisInfo()}},
  {t:'Vous, le locataire',fields:SENDER()},
  {t:'Justificatif',photos:1,pre:()=>photosHTML(),recapRows:()=>[['Justificatif',phCount()]],fields:[]},
  {t:'Le propriétaire',fields:RECIP('du propriétaire ou de l’agence','Exemple : « M. Jean DUPONT » ou « Agence Immo Sud ».')},
  letterSigStep(),
  {t:'Votre lettre',recap:1,fields:[]}
 ],
 recapSkip:[],recapMore:()=>[],
 recapBefore:()=>preavisInfo()+letterPreview('Congé du logement'+(clean1(d.logadr)?' situé '+clean1(d.logadr):''),preavisParas()),
 missing(){const m=letterMissing(),c=preavisCalc();if(!clean1(d.logadr))m.unshift('adresse du logement');if(c.justif&&!myPh().length)m.push('justificatif');return m},
 missWarn:'Vous pouvez quand même produire le PDF, mais complétez ces informations avant de l’envoyer.',
 mailHint:'mail du propriétaire ou de l’agence',
 recapAfter:()=>`<div class="note" style="margin-top:16px"><p>${d.mode==='main'?'<b>En main propre :</b> imprimez la lettre en deux exemplaires et faites signer et dater le reçu en bas de page par le propriétaire ; gardez un exemplaire.':'<b>Pour que le préavis compte :</b> imprimez le PDF et envoyez-le en <b>lettre recommandée avec accusé de réception</b>. Le mail seul ne suffit pas.'}</p></div>`,
 fname:()=>`Preavis_depart_${d.le||today}.pdf`,
 mail(){return {to:clean1(d.mailto),subj:'Congé du logement'+(clean1(d.logadr)?' — '+clean1(d.logadr):''),body:`Madame, Monsieur,\n\nVeuillez trouver ci-joint mon congé du logement, qui vous est également adressé ${d.mode==='main'?'en main propre':'par courrier recommandé avec accusé de réception'}.\n\n${fullName()}`}},
 build(){return letterPDF({objet:'Congé du logement'+(clean1(d.logadr)?' situé '+clean1(d.logadr):''),head:preavisHead(),paras:preavisParas(),after:d.mode==='main'?['Reçu en main propre le ____ / ____ / ________','Signature du bailleur :']:[],pj:myPh().length?'Pièce jointe : justificatif du préavis réduit.':'',ph:myPh(),annexTitle:'Pièce jointe : justificatif'})}
};

/* ================= Document 10 : demande de travaux au propriétaire ================= */
const TPB=[['chauffage','Chauffage en panne ou insuffisant'],['humidite','Humidité, moisissures'],['fuite','Fuite d’eau, infiltration'],['electricite','Installation électrique dangereuse'],['fenetres','Fenêtres ou portes qui ferment mal'],['nuisibles','Nuisibles (cafards, punaises, rats…)'],['autre','Autre problème']];
const TPB_TXT={chauffage:'le chauffage ne fonctionne pas correctement',humidite:'le logement présente de l’humidité et des moisissures',fuite:'une fuite d’eau ou une infiltration affecte le logement',electricite:'l’installation électrique présente un danger',fenetres:'les fenêtres ou les portes ne ferment pas correctement',nuisibles:'le logement est infesté de nuisibles',autre:'le logement présente un désordre'};
function travauxParas(){
 const L=[];
 L.push(`Je suis locataire du logement situé ${clean1(d.logadr)||'…'}${d.baildate?`, en vertu du bail signé le ${fr(d.baildate)}`:''}.`);
 L.push(`Depuis le ${fr(d.constat)||'…'}, ${TPB_TXT[d.pb]||'le logement présente un désordre'}${clean1(d.details)?' : '+clean1(d.details):''}.${d.signal?` Je vous l’ai déjà signalé le ${fr(d.signal)}, sans qu’une solution soit apportée.`:''}`);
 L.push(`Je vous rappelle qu’en application de l’article 6 de la loi n° 89-462 du 6 juillet 1989, le bailleur est tenu de remettre au locataire un logement décent, répondant aux caractéristiques définies par le décret n° 2002-120 du 30 janvier 2002, d’entretenir les locaux en état de servir à l’usage prévu et d’y faire toutes les réparations, autres que locatives, nécessaires au maintien en état et à l’entretien normal des locaux loués.`);
 L.push(`Je vous demande donc de faire réaliser les travaux nécessaires dans un délai de ${d.delai||'30'} jours à compter de la réception de la présente lettre. Je reste à votre disposition pour permettre l’accès au logement.`);
 L.push(`À défaut, je me réserve la possibilité de saisir la commission départementale de conciliation, puis, si nécessaire, le juge des contentieux de la protection.`);
 return L;
}
const TRAVAUX={
 key:'attest_travaux_v1',title:'Demande de travaux',sub:'Lettre au propriétaire (logement décent)',
 init:x=>{if(!x.le)x.le=today;if(!x.delai)x.delai='30'},
 maxPh:4,phLabels:[],phIntro:()=>`<p>Photographiez le problème (moisissures, fuite, radiateur, prise abîmée…). Les photos datées sont une preuve utile ; elles sont ajoutées à la fin du PDF (4 au maximum).</p>`,
 phBtn:n=>n?'Ajouter une photo':'Photographier le problème',
 steps:[
  {t:'Avant de commencer',pre:()=>`<div class="note"><p><b>À quoi sert cette lettre ?</b> Le propriétaire doit louer un <b>logement décent</b> et faire les grosses réparations (article 6 de la loi du 6 juillet 1989, décret n° 2002-120). Cette lettre lui demande officiellement de faire les travaux.</p></div>
 <div class="note warn"><ul>
  <li><b>Ne cessez pas de payer votre loyer</b> : vous pourriez être en faute, même si le logement a des défauts.</li>
  <li>Les petites réparations et l’entretien courant restent à la charge du locataire (réparations locatives).</li>
  <li>Sans réponse : commission départementale de conciliation (gratuite), puis juge. Vous pouvez aussi contacter le service d’hygiène de la mairie ou l’ADIL de votre département.</li></ul></div>`,fields:[]},
  {t:'Le problème',fields:[
   {k:'pb',l:'Quel est le problème principal ?',ty:'radio',o:TPB},
   {k:'details',l:'Décrivez-le',ty:'area',h:'Pièces concernées, conséquences (froid, odeurs, dégâts sur vos meubles…), autres problèmes éventuels.'},
   {row:[{k:'constat',l:'Constaté depuis le',ty:'date'},{k:'signal',l:'Déjà signalé le',ty:'date',h:'Facultatif'}]},
   {k:'delai',l:'Délai demandé pour les travaux',ty:'radio',o:[['15','15 jours'],['30','30 jours'],['60','2 mois']],h:'Pour un problème urgent (pas de chauffage en hiver, électricité dangereuse), un délai court est justifié.'}]},
  {t:'Votre logement',fields:[{k:'logadr',l:'Adresse du logement loué',ty:'text'},{k:'baildate',l:'Date du bail',ty:'date',h:'Facultatif.'}]},
  {t:'Photos',photos:1,pre:()=>photosHTML(),recapRows:()=>[['Photos',phCount()]],fields:[]},
  {t:'Vous, le locataire',fields:SENDER()},
  {t:'Le propriétaire',fields:RECIP('du propriétaire ou de l’agence','Exemple : « M. Jean DUPONT » ou « Agence Immo Sud ».')},
  letterSigStep(),
  {t:'Votre lettre',recap:1,fields:[]}
 ],
 recapSkip:['details'],recapMore:()=>[],
 recapBefore:()=>letterPreview('Demande de travaux — '+((TPB.find(x=>x[0]===d.pb)||[,'logement'])[1]).toLowerCase(),travauxParas()),
 missing(){const m=letterMissing();if(!d.pb)m.unshift('problème');if(!clean1(d.logadr))m.unshift('adresse du logement');return m},
 missWarn:'Vous pouvez quand même produire le PDF, mais complétez ces informations avant de l’envoyer.',
 mailHint:'mail du propriétaire ou de l’agence',
 recapAfter:lrarNote,
 fname:()=>`Demande_travaux_${d.le||today}.pdf`,
 mail(){return {to:clean1(d.mailto),subj:'Demande de travaux — '+(clean1(d.logadr)||'logement loué'),body:`Madame, Monsieur,\n\nVeuillez trouver ci-joint ma demande de travaux, avec des photos, qui vous est également adressée par courrier recommandé avec accusé de réception.\n\n${fullName()}`}},
 build(){return letterPDF({objet:'Demande de travaux — '+((TPB.find(x=>x[0]===d.pb)||[,'logement'])[1]).toLowerCase(),paras:travauxParas(),pj:myPh().length?'Pièces jointes : photos du logement.':'',ph:myPh(),annexTitle:'Pièces jointes : photos'})}
};

/* ================= Document 11 : réclamation facture d'énergie ou d'eau ================= */
const EN=[['elec','Électricité'],['gaz','Gaz'],['eau','Eau']];
const EMOT=[['estimation','Facture sur estimation, très différente de ma consommation'],['anormale','Consommation anormalement élevée'],['releve','Erreur de relevé du compteur'],['mensualisation','Erreur sur la mensualisation ou les prélèvements'],['rattrapage','Rattrapage de consommations anciennes'],['autre','Autre motif']];
const EMOT_TXT={estimation:'cette facture est établie sur une estimation qui ne correspond pas à ma consommation réelle',anormale:'elle fait apparaître une consommation anormalement élevée par rapport à mes consommations habituelles',releve:'elle repose sur un relevé erroné du compteur',mensualisation:'elle comporte une erreur dans le calcul de la mensualisation ou des prélèvements',rattrapage:'elle comporte un rattrapage de consommations anciennes',autre:'elle me paraît erronée'};
const pdlLabel=()=>d.energie==='gaz'?'N° PCE (point de comptage, 14 chiffres)':d.energie==='eau'?'N° de compteur ou de contrat':'N° PDL (point de livraison, 14 chiffres)';
function energieParas(){
 const L=[],en=(EN.find(x=>x[0]===d.energie)||[,'énergie'])[1].toLowerCase(),ids=[clean1(d.numclient)&&`n° client ${clean1(d.numclient)}`,clean1(d.pdl)&&`${d.energie==='gaz'?'PCE':d.energie==='eau'?'compteur':'PDL'} ${clean1(d.pdl)}`].filter(Boolean).join(', ');
 L.push(`Titulaire d’un contrat de fourniture d’${en==='eau'?'eau':en}${ids?` (${ids})`:''}${clean1(d.lieu)?` pour le logement situé ${clean1(d.lieu)}`:''}, je conteste la facture${clean1(d.facno)?` n° ${clean1(d.facno)}`:''}${d.facdate?` du ${fr(d.facdate)}`:''}${clean1(d.montant)?`, d’un montant de ${eur(num(d.montant))}`:''}.`);
 L.push(`En effet, ${EMOT_TXT[d.motif]||'elle me paraît erronée'}${clean1(d.details)?' : '+clean1(d.details):''}.`);
 if(clean1(d.index))L.push(`Le ${fr(d.idxdate)||'…'}, l’index relevé sur mon compteur était de ${clean1(d.index)}${d.idxphoto==='oui'?' (photo jointe)':''}.`);
 if(d.energie!=='eau'&&(d.motif==='rattrapage'||d.motif==='releve'||d.motif==='estimation'))L.push(`Je vous rappelle qu’aucune consommation d’électricité ou de gaz naturel antérieure de plus de quatorze mois au dernier relevé ou autorelevé ne peut être facturée, sauf exceptions prévues par l’article L. 224-11 du code de la consommation.`);
 L.push(`Je vous demande de vérifier ma consommation, de m’adresser une facture rectifiée et, le cas échéant, de me rembourser le trop-perçu. Dans l’attente, je vous remercie de suspendre le recouvrement de la somme contestée.`);
 L.push(d.energie==='eau'?`À défaut de réponse satisfaisante dans un délai de deux mois, je saisirai la Médiation de l’eau.`:`À défaut de réponse satisfaisante dans un délai de deux mois, je saisirai le Médiateur national de l’énergie.`);
 return L;
}
const energieObjet=()=>`Contestation de la facture${clean1(d.facno)?' n° '+clean1(d.facno):''}${d.facdate?' du '+fr(d.facdate):''}`;
const ENERGIE={
 key:'attest_energie_v1',title:'Réclamation facture',sub:'Électricité, gaz ou eau',
 init:x=>{if(!x.le)x.le=today;if(!x.energie)x.energie='elec'},
 maxPh:3,phLabels:[],phIntro:()=>`<p>Joignez si possible une <b>photo du compteur</b> (avec l’index lisible) et la <b>facture contestée</b>. Les photos sont ajoutées à la fin du PDF (3 au maximum).</p>`,
 phBtn:n=>n?'Ajouter une photo':'Photographier le compteur ou la facture',
 steps:[
  {t:'Avant de commencer',pre:()=>`<div class="note"><p><b>À quoi sert cette lettre ?</b> À contester une facture d’électricité, de gaz ou d’eau auprès du fournisseur : estimation trop élevée, erreur de relevé, consommation anormale, mensualisation…</p></div>
 <div class="note warn"><ul>
  <li>Relevez votre compteur et prenez-le en photo : c’est la meilleure preuve.</li>
  <li>Électricité et gaz : sans réponse satisfaisante sous <b>2 mois</b>, vous pouvez saisir gratuitement le <b>Médiateur national de l’énergie</b> (<a href="https://www.energie-mediateur.fr/" target="_blank" rel="noopener">energie-mediateur.fr</a>).</li>
  <li>Eau : après la réclamation au service des eaux, vous pouvez saisir la <b>Médiation de l’eau</b> (<a href="https://www.mediation-eau.fr/" target="_blank" rel="noopener">mediation-eau.fr</a>).</li></ul></div>`,fields:[]},
  {t:'Votre contrat',fields:[
   {k:'energie',l:'Facture de…',ty:'radio',o:EN},
   {k:'numclient',l:'N° client',ty:'text',h:'Il figure en haut de vos factures.'},
   {k:'pdl',l:'N° PDL, PCE ou compteur',ty:'text',h:'Électricité : PDL (14 chiffres) ; gaz : PCE (14 chiffres) ; eau : n° de compteur. Sur la facture.'},
   {k:'lieu',l:'Adresse du logement',ty:'text',h:'Si différente de votre adresse.'}]},
  {t:'La facture contestée',fields:[
   {row:[{k:'facno',l:'N° de facture',ty:'text'},{k:'facdate',l:'Date de la facture',ty:'date'}]},
   {k:'montant',l:'Montant (€)',ty:'text'},
   {k:'motif',l:'Ce qui ne va pas',ty:'radio',o:EMOT},
   {k:'details',l:'Précisions',ty:'area',h:'Facultatif. Exemple : « ma consommation habituelle est d’environ 300 kWh par mois ».'},
   {row:[{k:'index',l:'Index relevé sur le compteur',ty:'text',h:'Facultatif'},{k:'idxdate',l:'Relevé le',ty:'date'}]},
   {k:'idxphoto',l:'Avez-vous une photo du compteur ?',ty:'radio',o:YN}]},
  {t:'Photos',photos:1,pre:()=>photosHTML(),recapRows:()=>[['Photos',phCount()]],fields:[]},
  {t:'Vous',fields:SENDER()},
  {t:'Le fournisseur',fields:RECIP('du fournisseur ou du service des eaux','Exemple : « EDF — Service clients », « TotalEnergies », « Eau de Marseille ».')},
  letterSigStep(),
  {t:'Votre lettre',recap:1,fields:[]}
 ],
 recapSkip:['details'],recapMore:()=>[],
 recapBefore:()=>letterPreview(energieObjet(),energieParas()),
 missing(){const m=letterMissing();if(!d.motif)m.unshift('motif');if(!clean1(d.facno)&&!d.facdate)m.unshift('facture contestée');if(!clean1(d.numclient))m.unshift('n° client');return m},
 missWarn:'Vous pouvez quand même produire le PDF, mais complétez ces informations avant de l’envoyer.',
 mailHint:'service clients du fournisseur',
 recapAfter:()=>`<div class="note" style="margin-top:16px"><p>Envoyez la lettre par le formulaire de réclamation de votre espace client (en joignant le PDF) ou en <b>lettre recommandée avec accusé de réception</b>. Gardez la date : elle fait courir le délai de 2 mois avant la médiation.</p></div>`,
 fname:()=>`Reclamation_facture${fnDest()}_${d.le||today}.pdf`,
 mail(){return {to:clean1(d.mailto),subj:energieObjet(),body:`Madame, Monsieur,\n\nVeuillez trouver ci-joint ma réclamation concernant la facture${clean1(d.facno)?' n° '+clean1(d.facno):''}, avec les justificatifs.\n\n${fullName()}`}},
 build(){return letterPDF({objet:energieObjet(),paras:energieParas(),pj:myPh().length?'Pièces jointes : photos du compteur et de la facture.':'',ph:myPh(),annexTitle:'Pièces jointes',rec:false})}
};

/* ================= Document 12 : réclamation pour colis perdu ou abîmé ================= */
const colisVendeur=()=>d.cadre!=='envoi';
function colisParas(){
 const L=[],perdu=d.etat!=='abime',suivi=clean1(d.suivi);
 if(colisVendeur()){
  L.push(`Le ${fr(d.cmddate)||'…'}, j’ai commandé sur votre site ${clean1(d.contenu)||'…'}${clean1(d.cmdno)?` (commande n° ${clean1(d.cmdno)})`:''}${clean1(d.valeur)?`, pour un montant de ${eur(num(d.valeur))}`:''}${clean1(d.transp)?`, expédié par ${clean1(d.transp)}`:''}${suivi?` (n° de suivi ${suivi})`:''}.`);
  L.push(perdu?`Je n’ai jamais reçu ce colis.`:`Le colis m’a été livré le ${fr(d.livdate)||'…'} endommagé${clean1(d.degats)?' : '+clean1(d.degats):''}.${d.reserves==='oui'?' J’ai émis des réserves auprès du livreur lors de la livraison.':''}`);
  L.push(`Je vous rappelle que le vendeur est responsable de plein droit de la bonne exécution du contrat, livraison comprise, et que le risque de perte ou d’endommagement du bien ne m’est transféré qu’au moment où j’en prends physiquement possession (articles L. 216-4 et L. 221-15 du code de la consommation). Il vous appartient donc de vous retourner, le cas échéant, vers votre transporteur.`);
  L.push(perdu?`Je vous demande donc de me livrer le bien commandé ou, à défaut, de me rembourser la totalité des sommes versées, dans un délai de quinze jours.`:`Je vous demande donc de me remplacer le bien ou, à défaut, de me rembourser la totalité des sommes versées, dans un délai de quinze jours.`);
 }else{
  L.push(`Le ${fr(d.envdate)||'…'}, un colis contenant ${clean1(d.contenu)||'…'}${clean1(d.valeur)?`, d’une valeur de ${eur(num(d.valeur))}`:''}, a été confié à vos services${suivi?` sous le n° de suivi ${suivi}`:''}${clean1(d.dest)?`, à destination de ${clean1(d.dest)}`:''}.`);
  L.push(perdu?`Ce colis n’a jamais été livré et son suivi n’évolue plus.`:`Ce colis a été livré le ${fr(d.livdate)||'…'} endommagé${clean1(d.degats)?' : '+clean1(d.degats):''}.${d.reserves==='oui'?' Des réserves ont été émises lors de la livraison.':''}`);
  L.push(`Je vous demande de m’indemniser de la valeur du contenu${clean1(d.valeur)?`, soit ${eur(num(d.valeur))}`:''}, ainsi que des frais d’envoi, dans les conditions prévues par votre contrat de transport.`);
 }
 L.push(`Vous trouverez ci-joint les justificatifs dont je dispose. À défaut de réponse satisfaisante, je me réserve la possibilité de saisir le médiateur compétent, puis la juridiction compétente.`);
 return L;
}
const colisObjet=()=>`Réclamation — colis ${d.etat==='abime'?'endommagé':'non livré'}${clean1(d.suivi)?' (suivi '+clean1(d.suivi)+')':''}`;
const COLIS={
 key:'attest_colis_v1',title:'Colis perdu ou abîmé',sub:'Réclamation au vendeur ou au transporteur',
 init:x=>{if(!x.le)x.le=today;if(!x.cadre)x.cadre='achat';if(!x.etat)x.etat='perdu'},
 maxPh:4,phLabels:[],phIntro:()=>`<p>Joignez la <b>preuve d’achat ou de dépôt</b>, le <b>suivi du colis</b> (capture d’écran) et, s’il est abîmé, des <b>photos du colis et du contenu</b>. Les photos sont ajoutées à la fin du PDF (4 au maximum).</p>`,
 phBtn:n=>n?'Ajouter une photo':'Photographier un justificatif',
 steps:[
  {t:'Avant de commencer',pre:()=>`<div class="note"><p><b>À quoi sert cette lettre ?</b> À réclamer quand un colis n’arrive pas ou arrive abîmé.</p></div>
 <div class="note warn"><ul>
  <li><b>Vous avez acheté en ligne ?</b> C’est le <b>vendeur</b> qui est responsable de la livraison (article L. 216-4 du code de la consommation) : adressez la lettre au vendeur, pas au transporteur.</li>
  <li><b>Vous avez envoyé un colis vous-même</b> (ou reçu un envoi d’un particulier) : la réclamation va au transporteur, souvent par son formulaire en ligne, selon les conditions de votre envoi.</li>
  <li>Colis abîmé : notez vos réserves précises au livreur à la livraison, prenez des photos et, face à un transporteur, confirmez vos réserves par lettre recommandée dans les <b>3 jours</b> (article L. 133-3 du code de commerce).</li></ul></div>`,fields:[]},
  {t:'Votre situation',fields:[
   {k:'cadre',l:'Il s’agit…',ty:'radio',o:[['achat','D’un achat en ligne (je réclame au vendeur)'],['envoi','D’un envoi (je réclame au transporteur)']]},
   {k:'etat',l:'Le colis est…',ty:'radio',o:[['perdu','Perdu / jamais livré'],['abime','Livré abîmé']]}]},
  {t:'Le colis',fields:[
   {k:'contenu',l:'Contenu',ty:'text',h:'Exemple : « un téléphone Samsung Galaxy S25 ».'},
   {row:[{k:'cmdno',l:'N° de commande',ty:'text'},{k:'cmddate',l:'Date de commande',ty:'date'}],if:()=>colisVendeur()},
   {row:[{k:'envdate',l:'Date d’envoi',ty:'date'},{k:'dest',l:'Destinataire',ty:'text',h:'Facultatif'}],if:()=>!colisVendeur()},
   {row:[{k:'transp',l:'Transporteur',ty:'text',h:'Colissimo, Chronopost, Mondial Relay…'},{k:'suivi',l:'N° de suivi',ty:'text'}]},
   {k:'valeur',l:'Valeur (€)',ty:'text'},
   {k:'livdate',l:'Date de livraison',ty:'date',if:x=>x.etat==='abime'},
   {k:'degats',l:'Dégâts constatés',ty:'text',if:x=>x.etat==='abime'},
   {k:'reserves',l:'Des réserves ont-elles été faites à la livraison ?',ty:'radio',o:YN,if:x=>x.etat==='abime'}]},
  {t:'Justificatifs',photos:1,pre:()=>photosHTML(),recapRows:()=>[['Justificatifs',phCount()]],fields:[]},
  {t:'Vous',fields:SENDER()},
  {t:'Destinataire',pre:()=>`<div class="note"><p>${colisVendeur()?'Indiquez le <b>vendeur</b> (le site marchand).':'Indiquez le <b>transporteur</b> (service réclamations).'}</p></div>`,fields:RECIP('du vendeur ou du transporteur','Exemple : « Cdiscount — Service client » ou « La Poste — Service clients Colissimo ».')},
  letterSigStep(),
  {t:'Votre lettre',recap:1,fields:[]}
 ],
 recapSkip:[],recapMore:()=>[],
 recapBefore:()=>letterPreview(colisObjet(),colisParas()),
 missing(){const m=letterMissing();if(!clean1(d.contenu))m.unshift('contenu du colis');if(!clean1(d.suivi)&&!clean1(d.cmdno))m.unshift('n° de suivi ou de commande');return m},
 missWarn:'Vous pouvez quand même produire le PDF, mais complétez ces informations avant de l’envoyer.',
 mailHint:'service client',
 recapAfter:lrarNote,
 fname:()=>`Reclamation_colis${fnDest()}_${d.le||today}.pdf`,
 mail(){return {to:clean1(d.mailto),subj:colisObjet(),body:`Madame, Monsieur,\n\nVeuillez trouver ci-joint ma réclamation concernant ce colis, avec les justificatifs.\n\n${fullName()}`}},
 build(){return letterPDF({objet:colisObjet(),paras:colisParas(),pj:myPh().length?'Pièces jointes : justificatifs et photos.':'',ph:myPh(),annexTitle:'Pièces jointes'})}
};

/* ================= Document 13 : procuration simple ================= */
const POBJ=[['colis','Retirer un colis ou un envoi'],['document','Retirer un document'],['demarche','Accomplir une démarche'],['autre','Autre']];
const POBJ_TXT={colis:'retirer en mon nom le colis ou l’envoi suivant',document:'retirer en mon nom le document suivant',demarche:'accomplir en mon nom la démarche suivante',autre:'agir en mon nom pour'};
function procuParas(){
 const L=[];
 L.push(`Je soussigné${pE('a_')} ${pText('a_')},`);
 L.push(`donne procuration à ${pText('b_')},`);
 L.push(`pour ${POBJ_TXT[d.pobj]||'agir en mon nom pour'} : ${clean1(d.pdet)||'…'}${clean1(d.porg)?`, auprès de ${clean1(d.porg)}`:''}.`);
 L.push(d.pval==='date'?`Cette procuration est valable jusqu’au ${fr(d.pfin)||'…'}.`:`Cette procuration est valable pour cette seule opération.`);
 L.push(`Le mandataire présentera sa propre pièce d’identité ainsi qu’une copie de la mienne, jointes à la présente procuration.`);
 L.push(faitLe()+'.');
 return L;
}
const PROCU={
 key:'attest_procu_v1',title:'Procuration',sub:'Autoriser une personne à agir pour vous',
 init:x=>{if(!x.le)x.le=today;if(!x.pval)x.pval='une'},
 maxPh:4,phLabels:[],phIntro:()=>`<p>Joignez la <b>copie de votre pièce d’identité</b> (recto, et verso si besoin) et, si possible, celle du <b>mandataire</b>. Les photos sont ajoutées à la fin du PDF (4 au maximum).</p>`,
 phBtn:n=>n?'Ajouter une autre pièce d’identité':'Photographier votre pièce d’identité',
 steps:[
  {t:'Avant de commencer',pre:()=>`<div class="note"><p><b>À quoi sert ce document ?</b> Une procuration permet à une personne de confiance (le <b>mandataire</b>) d’agir à votre place pour une démarche précise : retirer un colis ou un document, faire une démarche administrative…</p></div>
 <div class="note warn"><ul>
  <li><b>Certaines démarches ont leur propre formulaire</b> : le <b>vote</b> se fait uniquement par la procuration officielle (maprocuration.gouv.fr, commissariat ou gendarmerie) ; <b>La Poste</b> demande sa propre procuration pour retirer les recommandés et colis de façon durable (pour un envoi unique, le verso de l’avis de passage suffit souvent) ; les <b>banques</b>, les <b>notaires</b> et certaines administrations ont aussi leurs formulaires.</li>
  <li>Une procuration simple ne permet pas de vendre un bien immobilier ou de signer un acte qui exige un notaire.</li>
  <li>Soyez précis sur l’objet et la durée.</li></ul></div>`,fields:[]},
  {t:'Vous (le mandant)',fields:personFields('a_')},
  {t:'Le mandataire',fields:personFields('b_')},
  {t:'L’objet de la procuration',fields:[
   {k:'pobj',l:'La procuration sert à…',ty:'radio',o:POBJ},
   {k:'pdet',l:'Précisez',ty:'text',h:'Exemple : « le colis n° 6A12345678901 », « mon passeport », « déposer mon dossier de demande de… ».'},
   {k:'porg',l:'Auprès de quel organisme ?',ty:'text',h:'Facultatif. Exemple : « Mairie de Marseille 8e », « Relais colis Tabac du Port ».'},
   {k:'pval',l:'Durée',ty:'radio',o:[['une','Pour cette seule fois'],['date','Jusqu’à une date']]},
   {k:'pfin',l:'Valable jusqu’au',ty:'date',if:x=>x.pval==='date',sub:1}]},
  {t:'Pièces d’identité',photos:1,pre:()=>photosHTML(),recapRows:()=>[['Pièces d’identité',phCount()]],fields:[]},
  {t:'Date et signatures',fields:[{row:[{k:'faita',l:'Fait à',ty:'text'},{k:'le',l:'Le',ty:'date'}]}],
   post:()=>padBox('sigT','sig','Signature du mandant (vous)','Signez avec le doigt')+padBox('sigB','sigb','Signature du mandataire (facultatif)','Le mandataire signe pour accepter'),
   pads:[['sigT','sig'],['sigB','sigb']],recapRows:()=>[['Signature du mandant',d.sigt?'Oui':'Non'],['Signature du mandataire',d.sigbt?'Oui':'Non']]},
  {t:'Récapitulatif et envoi',recap:1,fields:[]}
 ],
 recapSkip:[],recapMore:()=>[],
 recapBefore:()=>preview('PROCURATION',procuParas()),
 missing(){const m=[];if(!d.a_nom||!d.a_prenom)m.push('vos nom et prénom');if(!d.b_nom)m.push('mandataire');if(!d.pobj||!clean1(d.pdet))m.push('objet de la procuration');if(!d.sigt)m.push('votre signature');if(!myPh().length)m.push('copie de votre pièce d’identité');return m},
 missWarn:'Vous pouvez quand même produire le PDF, mais l’organisme risque de le refuser s’il manque des éléments.',
 mailHint:'mail du mandataire',
 recapAfter:()=>`<div class="note" style="margin-top:16px"><p>Envoyez le PDF au mandataire : il l’imprimera et le présentera avec sa pièce d’identité. Certains organismes exigent l’original signé à la main : en cas de doute, imprimez et signez aussi au stylo.</p></div>`,
 fname:()=>{const n=fnPart(d.b_nom);return `Procuration${n?'_'+n:''}_${d.le||today}.pdf`},
 mail(){return {to:clean1(d.mailto),subj:'Procuration',body:`Bonjour,\n\nVoici la procuration signée, avec la copie de ma pièce d’identité.\n\n${pName('a_')}`}},
 build(){return paperPDF({title:'PROCURATION',blocks:procuParas().map(p=>({p})),
  sigs:[{key:'sig',label:'Le mandant (bon pour pouvoir)',name:pName('a_')},{key:'sigb',label:'Le mandataire (bon pour acceptation)',name:pName('b_')}],ph:myPh(),annexTitle:'Pièces jointes : pièces d’identité',docTitle:'Procuration'})}
};

/* ================= Document 14 : contestation d'un forfait post-stationnement (RAPO) ================= */
const FMOT=[['paye','J’avais payé le stationnement'],['handicap','Carte de stationnement pour personnes handicapées'],['vendu','Véhicule vendu avant la date'],['vole','Véhicule volé'],['usurpation','Usurpation de plaques (ce n’était pas mon véhicule)'],['erreur','Erreur sur le véhicule ou le lieu'],['montant','Montant erroné ou paiement non déduit'],['autre','Autre motif']];
const FDATE={paye:'Date et heure de fin du paiement',vendu:'Date de la cession',vole:'Date du vol',usurpation:'Date de la plainte'};
const FJUST={paye:'le ticket ou la preuve de paiement (capture de l’appli de stationnement)',handicap:'la copie recto-verso de la carte (CMI stationnement ou carte européenne)',vendu:'le certificat de cession et l’accusé d’enregistrement de la déclaration de cession',vole:'le récépissé de déclaration de vol',usurpation:'le récépissé de plainte et une photo de votre véhicule',erreur:'la copie de votre certificat d’immatriculation (carte grise)',montant:'la preuve du paiement partiel',autre:'tout justificatif utile'};
function fpsFin(){const n=d.notif;if(!n)return null;let e=isoD(addMonths(n,1));while(e.getUTCDay()===0||e.getUTCDay()===6||ferie(e))e=new Date(e.getTime()+864e5);return isoS(e)}
function fpsInfo(){
 if(d.majore==='oui')return `<div class="note warn"><p><b>FPS majoré :</b> le recours préalable à la commune n’est plus possible. Vous pouvez saisir directement le <b>tribunal du stationnement payant</b> (<a href="https://tribunal-stationnement-payant.fr/" target="_blank" rel="noopener">tribunal-stationnement-payant.fr</a>), en ligne ou par courrier, avec le formulaire Cerfa prévu.</p></div>`;
 const fin=fpsFin();if(!fin)return `<div class="note"><p>Indiquez la date à laquelle vous avez reçu l’avis de paiement : l’appli calcule la date limite du recours.</p></div>`;
 const late=today>fin;
 return late?`<div class="note warn"><p><b>Attention : le délai d’un mois semble dépassé</b> (il se terminait le ${esc(frLong(fin))}). Le recours risque d’être rejeté comme tardif.</p></div>`
  :`<div class="note"><p><b>Date limite pour envoyer le recours : ${esc(frLong(fin))}</b> (1 mois après la réception de l’avis ; date indicative, reportée si elle tombe un week-end ou un jour férié).</p></div>`;
}
function fpsParas(){
 const L=[],m=d.motif,md=d.mdate?fr(d.mdate):'…',det=clean1(d.details);
 L.push(`En qualité de titulaire du certificat d’immatriculation du véhicule immatriculé ${clean1(d.immat).toUpperCase()||'…'}, je forme par la présente un recours administratif préalable obligatoire, en application de l’article L. 2333-87 du code général des collectivités territoriales, contre l’avis de paiement du forfait post-stationnement n° ${clean1(d.fpsno)||'…'}, établi le ${fr(d.fpsdate)||'…'}${clean1(d.heure)?' à '+clean1(d.heure):''}${clean1(d.lieu)?', '+clean1(d.lieu):''}${clean1(d.commune)?' ('+clean1(d.commune)+')':''}, d’un montant de ${clean1(d.montant)?eur(num(d.montant)):'…'}.`);
 if(m==='paye')L.push(`Le stationnement avait bien été payé, jusqu’au ${md}${det?' ('+det+')':''}. Je joins la preuve de ce paiement.`);
 else if(m==='handicap')L.push(`Je suis titulaire d’une carte mobilité inclusion portant la mention « stationnement pour personnes handicapées » (ou d’une carte européenne de stationnement), qui était apposée dans le véhicule. Cette carte permet de stationner gratuitement sur les places payantes de la voirie (article L. 241-3 du code de l’action sociale et des familles), dans les limites éventuellement fixées par la commune.${det?' '+det+'.':''} Je joins la copie de la carte.`);
 else if(m==='vendu')L.push(`Ce véhicule avait été cédé le ${md}${det?' à '+det:''}, soit avant la date du stationnement en cause, comme l’attestent le certificat de cession et la déclaration de cession enregistrée, joints à la présente.`);
 else if(m==='vole')L.push(`Ce véhicule avait été volé le ${md}, vol déclaré auprès des services de police ou de gendarmerie${det?' ('+det+')':''}. Je joins le récépissé de déclaration de vol.`);
 else if(m==='usurpation')L.push(`Mon véhicule ne se trouvait pas à cet endroit à cette date : il s’agit vraisemblablement d’une usurpation de plaques d’immatriculation, pour laquelle j’ai porté plainte le ${md}${det?' ('+det+')':''}. Je joins le récépissé de plainte.`);
 else if(m==='erreur')L.push(`L’avis de paiement comporte une erreur${det?' : '+det:''}. Le véhicule désigné ne correspond pas au mien, comme le montre la copie de mon certificat d’immatriculation jointe.`);
 else if(m==='montant')L.push(`Le montant réclamé est erroné${det?' : '+det:''}. Le montant du forfait doit être diminué de la somme déjà payée pour cette période de stationnement.`);
 else L.push(det?det+'.':'…');
 L.push(m==='montant'?`Je vous demande en conséquence de rectifier cet avis de paiement${d.dejapaye==='oui'?' et de me rembourser la somme indûment versée':''}.`:`Je vous demande en conséquence d’annuler cet avis de paiement${d.dejapaye==='oui'?' et de me rembourser la somme versée':''}.`);
 L.push(`Vous trouverez ci-joint la copie de l’avis de paiement, de mon certificat d’immatriculation et des justificatifs. À défaut d’annulation, je me réserve la possibilité de saisir le tribunal du stationnement payant.`);
 return L;
}
const fpsObjet=()=>`Recours administratif préalable obligatoire — forfait post-stationnement n° ${clean1(d.fpsno)||'…'}`;
const FPS={
 key:'attest_fps_v1',title:'Contester un FPS',sub:'Recours préalable obligatoire (RAPO)',
 init:x=>{if(!x.le)x.le=today;if(!x.majore)x.majore='non';if(!x.dejapaye)x.dejapaye='non'},
 maxPh:4,phLabels:[],phIntro:()=>`<p>Joignez la <b>copie de l’avis de paiement</b>, de votre <b>certificat d’immatriculation</b> (carte grise) et ${FJUST[d.motif]?'<b>'+esc(FJUST[d.motif])+'</b>':'vos justificatifs'}. Les photos sont ajoutées à la fin du PDF (4 au maximum).</p>`,
 phBtn:n=>n?'Ajouter un justificatif':'Photographier l’avis de paiement',
 steps:[
  {t:'Avant de commencer',pre:()=>`<div class="note"><p><b>À quoi sert cette lettre ?</b> Depuis 2018, un stationnement payant non payé donne lieu à un <b>forfait post-stationnement (FPS)</b>, fixé par la commune. Pour le contester, il faut d’abord adresser un <b>recours administratif préalable obligatoire (RAPO)</b> à la commune ou à la société indiquée sur l’avis, dans un délai d’<b>un mois</b>.</p></div>
 <div class="note warn"><ul>
  <li><b>Ce n’est pas une amende :</b> pour une contravention (stationnement gênant, très gênant, dangereux ou abusif, excès de vitesse…), la contestation se fait auprès de l’officier du ministère public, en ligne sur le site officiel de l’ANTAI (antai.gouv.fr). Cette lettre ne sert pas pour ces cas.</li>
  <li>Envoyez le recours par <b>lettre recommandée avec accusé de réception</b>, ou par le service en ligne indiqué sur l’avis (vous pouvez y joindre ce PDF). Il doit en principe être fait par le titulaire de la carte grise.</li>
  <li>Sans réponse dans un délai d’un mois, le recours est considéré comme rejeté. Vous pouvez alors saisir le <b>tribunal du stationnement payant</b> dans le mois suivant ; il faut en principe avoir payé le FPS au préalable (sauf vol, cession ou usurpation de plaques).</li></ul></div>`,fields:[]},
  {t:'L’avis de paiement',fields:[
   {k:'majore',l:'Avez-vous reçu un FPS majoré (« avis de FPS majoré ») ?',ty:'radio',o:YN},
   {row:[{k:'fpsno',l:'N° de l’avis de paiement',ty:'text'},{k:'montant',l:'Montant (€)',ty:'text'}]},
   {row:[{k:'fpsdate',l:'Date du stationnement',ty:'date'},{k:'heure',l:'Heure',ty:'text',h:'Facultatif'}]},
   {row:[{k:'lieu',l:'Lieu (rue)',ty:'text'},{k:'commune',l:'Commune',ty:'text'}]},
   {k:'immat',l:'Immatriculation du véhicule',ty:'text',h:'Exemple : AB-123-CD'},
   {k:'notif',l:'Date de réception de l’avis',ty:'date',h:'Date de réception du courrier de l’ANTAI, ou date de l’avis laissé sur le pare-brise.'},
   {k:'dejapaye',l:'Avez-vous déjà payé ce FPS ?',ty:'radio',o:YN}],
   post:()=>`<div id="finfo">${fpsInfo()}</div>`,live:['notif'],liveFn:()=>{const c=$('#finfo');if(c)c.innerHTML=fpsInfo()}},
  {t:'Pourquoi le contester ?',fields:[
   {k:'motif',l:'Motif',ty:'radio',o:FMOT},
   {k:'mdate',l:'Date',ty:'date',if:x=>!!FDATE[x.motif],h:''},
   {k:'details',l:'Précisions',ty:'area',h:'Exemple : « ticket n° 4521 payé par l’appli PayByPhone de 14 h à 16 h », « véhicule vendu à M. Durand ».'}],
   pre:()=>d.motif&&FDATE[d.motif]?`<div class="note"><p>Date demandée : <b>${esc(FDATE[d.motif].toLowerCase())}</b>. Justificatif à joindre : ${esc(FJUST[d.motif])}.</p></div>`:d.motif?`<div class="note"><p>Justificatif à joindre : ${esc(FJUST[d.motif])}.</p></div>`:''},
  {t:'Justificatifs',photos:1,pre:()=>photosHTML(),recapRows:()=>[['Justificatifs',phCount()]],fields:[]},
  {t:'Vous (titulaire de la carte grise)',fields:SENDER()},
  {t:'Le destinataire',pre:()=>`<div class="note"><p>Recopiez l’adresse « pour contester » indiquée sur l’avis de paiement : c’est la commune ou la société chargée du stationnement, <b>pas l’ANTAI</b>.</p></div>`,fields:RECIP('de la commune ou de la société indiquée sur l’avis','Exemple : « Ville de Marseille — Service des RAPO ».')},
  letterSigStep(),
  {t:'Votre recours',recap:1,fields:[]}
 ],
 recapSkip:['details'],recapMore:()=>[],
 recapBefore:()=>fpsInfo()+(d.majore==='oui'?'':letterPreview(fpsObjet(),fpsParas())),
 missing(){const m=letterMissing();if(!clean1(d.fpsno))m.unshift('n° de l’avis');if(!clean1(d.immat))m.unshift('immatriculation');if(!d.motif)m.unshift('motif');if(!myPh().length)m.push('justificatifs');return m},
 missWarn:'Vous pouvez quand même produire le PDF, mais un recours incomplet risque d’être rejeté.',
 mailHint:'adresse indiquée sur l’avis (si envoi par mail accepté)',
 recapAfter:()=>`<div class="note" style="margin-top:16px"><p><b>Pour l’envoyer :</b> par <b>lettre recommandée avec accusé de réception</b> à l’adresse indiquée sur l’avis, ou par le service en ligne de la commune (joignez-y ce PDF), avant la date limite. Gardez la preuve d’envoi.</p></div>`,
 fname:()=>`Recours_FPS_${fnPart(d.fpsno)||'avis'}_${d.le||today}.pdf`,
 mail(){return {to:clean1(d.mailto),subj:fpsObjet(),body:`Madame, Monsieur,\n\nVeuillez trouver ci-joint mon recours administratif préalable obligatoire contre le forfait post-stationnement n° ${clean1(d.fpsno)||'…'}, avec les justificatifs.\n\n${fullName()}`}},
 build(){return letterPDF({objet:fpsObjet(),paras:fpsParas(),pj:'Pièces jointes : copie de l’avis de paiement, du certificat d’immatriculation et des justificatifs.',ph:myPh(),annexTitle:'Pièces jointes'})}
};

/* ================= Document 15 : contestation d'un paiement frauduleux par carte ================= */
function fraudeParas(){
 const L=[],ops=String(d.ops||'').split('\n').map(clean1).filter(Boolean),last4=clean1(d.last4).replace(/\D/g,'').slice(-4);
 L.push(`Titulaire du compte${clean1(d.compte)?` n° ${clean1(d.compte)}`:''} ouvert dans votre établissement${last4?` et de la carte bancaire se terminant par ${last4}`:''}, je conteste ${ops.length>1?'les opérations suivantes, que je n’ai pas autorisées':'l’opération suivante, que je n’ai pas autorisée'} :`);
 L.push(...(ops.length?ops.map(o=>'– '+o):['– …']));
 if(clean1(d.total))L.push(`Montant total contesté : ${eur(num(d.total))}.`);
 L.push(d.carte==='possession'?`Ma carte est toujours en ma possession : ces paiements résultent d’une utilisation frauduleuse de ses données. ${d.opp?`J’ai fait opposition le ${fr(d.opp)}.`:''}`
  :`Ma carte m’a été ${d.carte==='volee'?'volée':'perdue'}${d.cdate?` le ${fr(d.cdate)}`:''}. ${d.opp?`J’ai fait opposition le ${fr(d.opp)}.`:''}`);
 if(d.signal==='perceval')L.push(`J’ai signalé cette fraude sur la plateforme Perceval du ministère de l’Intérieur${clean1(d.sigref)?` (référence ${clean1(d.sigref)})`:''}.`);
 else if(d.signal==='plainte')L.push(`J’ai déposé plainte${clean1(d.sigref)?` (référence ${clean1(d.sigref)})`:''}.`);
 L.push(`Conformément à l’article L. 133-18 du code monétaire et financier, je vous demande de me rembourser immédiatement le montant de ${ops.length>1?'ces opérations non autorisées':'cette opération non autorisée'}, et au plus tard à la fin du premier jour ouvrable suivant la présente notification, en rétablissant mon compte dans l’état où il se serait trouvé si ${ops.length>1?'elles n’avaient':'elle n’avait'} pas eu lieu (frais et agios compris).`);
 if(d.carte==='possession')L.push(`Je vous rappelle que ma responsabilité n’est pas engagée lorsque l’opération a été effectuée, sans que la carte soit perdue ou volée, par détournement de ses données (article L. 133-19 du même code).`);
 L.push(`À défaut de remboursement, je saisirai le médiateur de votre établissement, puis, si nécessaire, la juridiction compétente.`);
 return L;
}
const fraudeObjet=()=>`Contestation d’opération${String(d.ops||'').split('\n').filter(x=>clean1(x)).length>1?'s':''} non autorisée${String(d.ops||'').split('\n').filter(x=>clean1(x)).length>1?'s':''} par carte bancaire`;
function fraudeInfo(){
 const ops=String(d.ops||'').split('\n').map(clean1).filter(Boolean);
 const dates=(String(d.ops||'').match(/\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/g)||[]).map(s=>{const [a,b,c]=s.split('/');return `${c}-${b.padStart(2,'0')}-${a.padStart(2,'0')}`}).sort();
 const old=dates.length&&addMonths(dates[0],13)<today;
 return `<div class="note${old?' warn':''}"><p>${ops.length?`${ops.length} opération${ops.length>1?'s':''} contestée${ops.length>1?'s':''}.`:'Indiquez une opération par ligne.'}${old?' <b>Attention : une opération de plus de 13 mois ne peut en principe plus être contestée.</b>':''}</p></div>`;
}
const FRAUDE={
 key:'attest_fraude_v1',title:'Paiement frauduleux',sub:'Contester une opération par carte non autorisée',
 init:x=>{if(!x.le)x.le=today;if(!x.carte)x.carte='possession';if(!x.signal)x.signal='non'},
 maxPh:3,phLabels:[],phIntro:()=>`<p>Joignez si possible le <b>relevé de compte</b> (ou une capture de l’appli bancaire) montrant les opérations, et le <b>récépissé</b> de signalement Perceval ou de plainte. Les photos sont ajoutées à la fin du PDF (3 au maximum).</p>`,
 phBtn:n=>n?'Ajouter un justificatif':'Photographier le relevé ou la capture',
 steps:[
  {t:'Avant de commencer',pre:()=>`<div class="note"><p><b>À quoi sert cette lettre ?</b> À demander à votre banque le remboursement d’un paiement par carte que vous n’avez pas fait : carte piratée sur internet, carte perdue ou volée.</p></div>
 <div class="note warn"><ul>
  <li><b>D’abord, faites opposition</b> sur votre carte (appli de la banque ou numéro d’opposition au dos de votre carte ou sur le site de la banque).</li>
  <li>Signalez la fraude sur <b>Perceval</b> (service en ligne officiel, accessible avec FranceConnect) si votre carte est toujours en votre possession ; en cas de vol, portez plainte.</li>
  <li>Contestez <b>sans tarder</b>, et au plus tard <b>13 mois</b> après le débit. La banque doit en principe rembourser au plus tard à la fin du jour ouvrable suivant, sauf si elle soupçonne une fraude de votre part ou prouve une négligence grave (code PIN noté sur la carte, codes communiqués…).</li>
  <li><b>Si c’est vous qui avez validé le paiement</b> (par exemple à la demande d’un faux conseiller bancaire), le remboursement est plus incertain : contestez quand même, et renseignez-vous (association de consommateurs, médiateur).</li>
  <li><b>Ne donnez jamais le numéro complet de votre carte</b> : l’appli ne demande que les 4 derniers chiffres.</li></ul></div>`,fields:[]},
  {t:'Les opérations contestées',fields:[
   {k:'ops',l:'Une opération par ligne : date, montant, bénéficiaire',ty:'area',big:1,h:'Exemple : « 12/11/2026 — 249,90 € — SHOPXYZ.COM ».'},
   {k:'total',l:'Montant total (€)',ty:'text',h:'Facultatif.'}],
   post:()=>`<div id="fxinfo">${fraudeInfo()}</div>`,live:['ops'],liveFn:()=>{const c=$('#fxinfo');if(c)c.innerHTML=fraudeInfo()}},
  {t:'Votre carte',fields:[
   {k:'last4',l:'4 derniers chiffres de la carte',ty:'tel',h:'Seulement les 4 derniers chiffres.'},
   {k:'compte',l:'N° de compte',ty:'text',h:'Facultatif. Vous pouvez n’indiquer que les derniers chiffres.'},
   {k:'carte',l:'Votre carte est…',ty:'radio',o:[['possession','Toujours en ma possession'],['perdue','Perdue'],['volee','Volée']]},
   {k:'cdate',l:'Date de la perte ou du vol',ty:'date',if:x=>x.carte!=='possession',sub:1},
   {k:'opp',l:'Date de l’opposition',ty:'date'},
   {k:'signal',l:'Avez-vous signalé la fraude ?',ty:'radio',o:[['perceval','Oui, sur Perceval'],['plainte','Oui, par une plainte'],['non','Pas encore']]},
   {k:'sigref',l:'Référence du signalement ou de la plainte',ty:'text',if:x=>x.signal!=='non',sub:1}]},
  {t:'Justificatifs',photos:1,pre:()=>photosHTML(),recapRows:()=>[['Justificatifs',phCount()]],fields:[]},
  {t:'Vous',fields:SENDER()},
  {t:'Votre banque',fields:RECIP('de la banque et de l’agence','Exemple : « Banque du Sud — Agence Castellane ».')},
  letterSigStep(),
  {t:'Votre lettre',recap:1,fields:[]}
 ],
 recapSkip:['ops'],recapMore:i=>i===1&&clean1(d.ops)?[['Opérations',String(d.ops).split('\n').map(clean1).filter(Boolean).join(' ; ')]]:[],
 recapBefore:()=>fraudeInfo()+letterPreview(fraudeObjet(),fraudeParas()),
 missing(){const m=letterMissing();if(!clean1(d.ops))m.unshift('opérations contestées');if(String(d.last4||'').replace(/D/g,'').length>4)m.unshift('n’indiquez que les 4 derniers chiffres de la carte (étape 3)');if(!d.opp)m.push('date de l’opposition');return m},
 missWarn:'Vous pouvez quand même produire le PDF, mais complétez ces informations avant de l’envoyer.',
 mailHint:'messagerie ou mail de votre conseiller',
 recapAfter:()=>`<div class="note" style="margin-top:16px"><p><b>Pour l’envoyer :</b> déposez la lettre dans la messagerie sécurisée de votre banque ou de votre appli (en joignant le PDF) <b>et</b> envoyez-la en <b>lettre recommandée avec accusé de réception</b> à votre agence. Gardez les preuves.</p></div>`,
 fname:()=>`Contestation_paiement_${d.le||today}.pdf`,
 mail(){return {to:clean1(d.mailto),subj:fraudeObjet(),body:`Madame, Monsieur,\n\nVeuillez trouver ci-joint ma contestation d’opérations non autorisées sur ma carte bancaire, avec les justificatifs. Elle vous est également adressée par courrier recommandé avec accusé de réception.\n\n${fullName()}`}},
 build(){return letterPDF({objet:fraudeObjet(),paras:fraudeParas(),pj:myPh().length?'Pièces jointes : relevé des opérations et justificatifs.':'',ph:myPh(),annexTitle:'Pièces jointes'})}
};

/* ================= Document 16 : attestation sur l'honneur ================= */
const HMOD=[['libre','Texte libre'],['domicile','Domicile (je réside à…)'],['celib','Situation familiale (célibataire…)'],['exact','Exactitude des informations d’un dossier'],['hebergeT','Je ne suis pas hébergé(e) ni propriétaire ailleurs'],['autre','Autre (à rédiger)']];
const hModel=()=>({domicile:`résider à l’adresse suivante : ${pAddr('a_')||'…'}`,celib:'être célibataire et ne pas être lié(e) par un pacte civil de solidarité',exact:'l’exactitude des informations que j’ai fournies dans mon dossier de …',hebergeT:'ne pas être propriétaire d’un autre logement et ne pas disposer d’un autre domicile'}[d.hmod]||'');
function honneurParas(){
 const L=[];
 L.push(`Je soussigné${pE('a_')} ${pText('a_')},`);
 L.push(`atteste sur l’honneur ${clean1(d.htexte)||'…'}${/[.!?]$/.test(clean1(d.htexte))?'':'.'}`);
 if(clean1(d.hdest))L.push(`Cette attestation est établie à la demande de ${clean1(d.hdest)}, pour servir et valoir ce que de droit.`);
 else L.push(`Attestation établie pour servir et valoir ce que de droit.`);
 L.push(`Je suis informé${pE('a_')} que l’établissement d’une attestation faisant état de faits matériellement inexacts est puni d’un an d’emprisonnement et de 15 000 € d’amende (article 441-7 du code pénal).`);
 L.push(faitLe()+'.');
 return L;
}
const HONNEUR={
 key:'attest_honneur_v1',title:'Attestation sur l’honneur',sub:'Pour une administration, un employeur, une école…',
 init:x=>{if(!x.le)x.le=today;if(!x.hmod)x.hmod='libre'},
 maxPh:2,phLabels:['Pièce d’identité (recto)','Pièce d’identité (verso)'],phIntro:()=>`<p>Beaucoup d’organismes demandent la <b>copie de votre pièce d’identité</b> avec l’attestation. Photographiez-la si besoin : elle est ajoutée à la fin du PDF.</p>`,
 phBtn:n=>n?'Photographier le verso':'Photographier votre pièce d’identité',
 steps:[
  {t:'Avant de commencer',pre:()=>`<div class="note"><p><b>À quoi sert ce document ?</b> Une attestation sur l’honneur est une déclaration écrite par laquelle vous certifiez qu’un fait est exact : domicile, situation familiale, absence de revenus, exactitude d’un dossier…</p></div>
 <div class="note warn"><ul>
  <li>Une fausse attestation est punie d’un an de prison et de 15 000 € d’amende (article 441-7 du code pénal) : la mention figure dans le document.</li>
  <li>Si l’organisme vous fournit <b>son propre modèle</b> ou un formulaire Cerfa, utilisez plutôt celui-ci.</li>
  <li>Pour héberger quelqu’un ou témoigner en justice, utilisez l’attestation d’hébergement ou l’attestation de témoin de cette appli.</li></ul></div>`,fields:[]},
  {t:'Vous',fields:personFields('a_')},
  {t:'Ce que vous attestez',fields:[
   {k:'hmod',l:'Modèle',ty:'radio',o:HMOD,h:'Choisissez un modèle puis appuyez sur « Utiliser ce texte », ou écrivez librement.'},
   {k:'htexte',l:'J’atteste sur l’honneur…',ty:'area',h:'Complétez la phrase. Exemple : « ne percevoir aucun revenu depuis le 1er janvier 2026 ».'},
   {k:'hdest',l:'À la demande de (organisme)',ty:'text',h:'Facultatif. Exemple : « la CAF des Bouches-du-Rhône ».'}],
   pre:()=>hModel()?`<div class="note"><p>Texte proposé : « ${esc(hModel())} »</p><button type="button" class="btn" id="usemod" style="margin-top:6px">Utiliser ce texte</button></div>`:''},
  {t:'Pièce d’identité',photos:1,pre:()=>photosHTML(),recapRows:()=>[['Pièce d’identité',phCount()]],fields:[]},
  sigStep(),
  {t:'Récapitulatif et envoi',recap:1,fields:[]}
 ],
 recapSkip:[],recapMore:()=>[],
 recapBefore:()=>preview('ATTESTATION SUR L’HONNEUR',honneurParas()),
 missing(){const m=[];if(!d.a_nom||!d.a_prenom)m.push('vos nom et prénom');if(!clean1(d.htexte))m.push('ce que vous attestez');if(!d.sigt)m.push('signature');return m},
 missWarn:'Vous pouvez quand même produire le PDF, mais complétez ces informations avant de l’envoyer.',
 mailHint:'organisme qui la demande',
 recapAfter:()=>`<div class="note" style="margin-top:16px"><p>Envoyez le PDF à l’organisme qui vous l’a demandée. Certains organismes exigent une signature au stylo : en cas de doute, imprimez et signez aussi à la main.</p></div>`,
 fname:()=>{const n=fnPart(d.a_nom);return `Attestation_honneur${n?'_'+n:''}_${d.le||today}.pdf`},
 mail(){return {to:clean1(d.mailto),subj:'Attestation sur l’honneur'+(pName('a_')?' — '+pName('a_'):''),body:`Bonjour,\n\nVeuillez trouver ci-joint mon attestation sur l’honneur signée.\n\nCordialement,\n${pName('a_')}`}},
 build(){return paperPDF({title:'ATTESTATION SUR L’HONNEUR',blocks:honneurParas().map(p=>({p})),sigs:[{key:'sig',label:'Signature',name:pName('a_')}],ph:myPh(),phLabels:['Pièce d’identité (recto)','Pièce d’identité (verso)'],annexTitle:'Pièce jointe : pièce d’identité',docTitle:'Attestation sur l’honneur'})}
};
document.addEventListener('click',e=>{if(e.target.closest('#usemod')&&doc===HONNEUR){d.htexte=hModel();save();keepScroll()}});

/* ================= Document 17 : recours contre un organisme social (CAF, CPAM, MSA, France Travail) ================= */
const ORGS=[['caf','CAF (allocations familiales)'],['cpam','CPAM (Assurance maladie)'],['msa','MSA'],['ft','France Travail'],['autre','Autre organisme']];
const ORG_NOM={caf:'la Caisse d’allocations familiales',cpam:'la Caisse primaire d’assurance maladie',msa:'la Mutualité sociale agricole',ft:'France Travail',autre:'votre organisme'};
const ORG_ID={caf:'N° d’allocataire',cpam:'N° de sécurité sociale',msa:'N° de sécurité sociale ou d’adhérent',ft:'Identifiant France Travail',autre:'N° de dossier'};
const RDEM=[['contest','Contester une décision'],['remise','Demander une remise de dette (trop-perçu)'],['echelon','Demander un échelonnement']];
const hasCRA=()=>['caf','cpam','msa'].includes(d.org);
function recoursFin(){if(d.rdem!=='contest'||!d.notif)return null;let e=isoD(addMonths(d.notif,2));while(e.getUTCDay()===0||e.getUTCDay()===6||ferie(e))e=new Date(e.getTime()+864e5);return isoS(e)}
function recoursInfo(){
 const fin=recoursFin();let h='';
 if(d.rdem==='contest'){
  if(hasCRA())h+=`<p><b>Recours amiable :</b> la contestation est examinée par la <b>commission de recours amiable</b> de ${esc(ORG_NOM[d.org])}, saisie dans un délai de <b>2 mois</b> après la notification de la décision (article R. 142-1 du code de la sécurité sociale).${fin?` Date limite indicative : <b>${esc(frLong(fin))}</b>.`:''}${fin&&today>fin?' <b>Attention : ce délai semble dépassé.</b>':''}</p>`;
  else if(d.org==='ft')h+=`<p><b>France Travail :</b> adressez votre réclamation ou votre recours à votre agence ou au directeur de l’agence ; respectez le délai indiqué sur la décision (souvent 2 mois).</p>`;
  else h+=`<p>Respectez le délai et l’adresse de recours indiqués sur la décision (souvent 2 mois).</p>`;
  if(d.org==='caf')h+=`<p>Pour le <b>RSA</b>, le recours s’adresse en principe au <b>président du conseil départemental</b> : vérifiez l’adresse indiquée sur la décision.</p>`;
  if(d.org==='cpam')h+=`<p>Pour une contestation <b>médicale</b> (arrêt de travail, invalidité, taux d’incapacité…), une procédure spéciale s’applique : suivez les indications de la décision.</p>`;
 }else h+=`<p>Vous ne contestez pas la dette mais demandez ${d.rdem==='remise'?'à ne pas la rembourser, en tout ou partie, en raison de votre situation (<b>remise de dette</b>)':'à la rembourser par petites mensualités (<b>échelonnement</b>)'}. Joignez les justificatifs de vos ressources et de vos charges.</p>`;
 h+=`<p>Sans réponse dans un délai de 2 mois, la demande est en général considérée comme rejetée. Vous pouvez aussi saisir le <b>médiateur</b> de l’organisme, puis le tribunal (pôle social du tribunal judiciaire pour la sécurité sociale).</p>`;
 return `<div class="note">${h}</div>`;
}
function recoursParas(){
 const L=[],org=ORG_NOM[d.org]||'votre organisme',idl=ORG_ID[d.org]||'N° de dossier',ident=clean1(d.ident);
 const ref=`${ident?`${idl} : ${ident}. `:''}`;
 const dec=`votre décision${d.notif?` notifiée le ${fr(d.notif)}`:''}${clean1(d.objet)?`, relative à ${clean1(d.objet)}`:''}${clean1(d.montant)?` (montant en cause : ${eur(num(d.montant))})`:''}`;
 if(ref)L.push(ref.trim());
 if(d.rdem==='contest'){
  L.push(hasCRA()?`Par la présente, je conteste ${dec}, et vous demande de soumettre ma réclamation à la commission de recours amiable, conformément à l’article R. 142-1 du code de la sécurité sociale.`
   :`Par la présente, je forme un recours contre ${dec}.`);
  L.push(clean1(d.motifs)?clean1(d.motifs).replace(/\.?$/,'.'):'…');
  L.push(`Je vous demande en conséquence de réexaminer ma situation et d’annuler ou de modifier cette décision.${clean1(d.montant)&&d.objtype==='indu'?' Dans l’attente, je vous demande de suspendre le recouvrement de la somme réclamée.':''}`);
 }else{
  L.push(`Par la présente, je sollicite ${d.rdem==='remise'?'une remise totale ou partielle':'un échelonnement du remboursement'} de la dette qui m’est réclamée suite à ${dec}.`);
  L.push(`Je ne conteste pas le principe de cette somme, mais ma situation financière ne me permet pas de la rembourser${d.rdem==='echelon'?' en une seule fois':''}. ${clean1(d.situation)?clean1(d.situation).replace(/\.?$/,'.'):''}`.trim());
  const fin=[clean1(d.ressources)&&`ressources mensuelles du foyer : ${eur(num(d.ressources))}`,clean1(d.charges)&&`charges mensuelles : ${eur(num(d.charges))}`,clean1(d.foyer)&&`composition du foyer : ${clean1(d.foyer)}`].filter(Boolean);
  if(fin.length)L.push(`Pour information : ${fin.join(' ; ')}.`);
  if(d.rdem==='echelon')L.push(`Je propose de rembourser cette somme par mensualités de ${clean1(d.mensualite)?eur(num(d.mensualite)):'…'}.`);
  if(clean1(d.motifs))L.push(clean1(d.motifs).replace(/\.?$/,'.'));
  L.push(`Je vous remercie de l’attention que vous porterez à ma demande.`);
 }
 L.push(`Vous trouverez ci-joint la copie de la décision et les justificatifs utiles.`);
 return L;
}
const recoursObjet=()=>`${d.rdem==='remise'?'Demande de remise de dette':d.rdem==='echelon'?'Demande d’échelonnement de dette':hasCRA()?'Recours amiable devant la commission de recours amiable':'Recours contre une décision'}${clean1(d.ident)?' — '+(ORG_ID[d.org]||'dossier')+' '+clean1(d.ident):''}`;
const RECOURS={
 key:'attest_recours_v1',title:'Recours CAF, CPAM, France Travail',sub:'Contester une décision ou un trop-perçu',
 init:x=>{if(!x.le)x.le=today;if(!x.org)x.org='caf';if(!x.rdem)x.rdem='contest'},
 maxPh:4,phLabels:[],phIntro:()=>`<p>Joignez la <b>décision contestée</b> (ou la notification de trop-perçu) et vos <b>justificatifs</b>${d.rdem!=='contest'?' : derniers bulletins de salaire ou attestations de ressources, quittance de loyer, factures, relevés…':''}. Les photos sont ajoutées à la fin du PDF (4 au maximum).</p>`,
 phBtn:n=>n?'Ajouter un justificatif':'Photographier la décision',
 steps:[
  {t:'Avant de commencer',pre:()=>`<div class="note"><p><b>À quoi sert cette lettre ?</b> À contester une décision de la CAF, de la CPAM, de la MSA ou de France Travail (aide refusée ou suspendue, trop-perçu réclamé, remboursement refusé…), ou à demander une remise ou un échelonnement de dette.</p></div>
 <div class="note warn"><ul>
  <li>Lisez bien la décision : elle indique <b>le délai et l’adresse du recours</b> (souvent la commission de recours amiable, dans les 2 mois).</li>
  <li>Le recours peut souvent aussi se faire depuis votre espace en ligne (rubrique « réclamation » ou « contester ») : vous pouvez y joindre ce PDF.</li>
  <li>Restez factuel, joignez les preuves, gardez une copie et la preuve d’envoi.</li></ul></div>`,fields:[]},
  {t:'L’organisme et votre demande',fields:[
   {k:'org',l:'Organisme',ty:'radio',o:ORGS},
   {k:'orgautre',l:'Lequel ?',ty:'text',if:x=>x.org==='autre',sub:1},
   {k:'rdem',l:'Vous voulez…',ty:'radio',o:RDEM}],post:()=>`<div id="rinfo2">${recoursInfo()}</div>`},
  {t:'La décision',fields:[
   {k:'ident',l:'Votre identifiant',ty:'text',h:'N° d’allocataire, de sécurité sociale ou identifiant France Travail.'},
   {k:'notif',l:'Date de la décision ou du courrier',ty:'date'},
   {k:'objtype',l:'De quoi s’agit-il ?',ty:'radio',o:[['indu','Un trop-perçu (indu) réclamé'],['refus','Une aide refusée, réduite ou suspendue'],['autre','Autre décision']]},
   {k:'objet',l:'Précisez',ty:'text',h:'Ex. : « l’aide personnalisée au logement de janvier à juin 2026 », « le remboursement de mes soins dentaires ».'},
   {k:'montant',l:'Montant en cause (€)',ty:'text',h:'Facultatif.'}],
   post:()=>`<div id="rinfo">${recoursInfo()}</div>`,live:['notif'],liveFn:()=>{const c=$('#rinfo');if(c)c.innerHTML=recoursInfo()}},
  {t:'Vos arguments et votre situation',fields:[
   {k:'motifs',l:'Vos arguments',ty:'area',big:1,h:'Pourquoi la décision est erronée (erreur sur vos ressources, sur votre situation, justificatif déjà envoyé…), ou toute précision utile pour une remise de dette.'},
   {k:'situation',l:'Votre situation',ty:'area',h:'Ex. : perte d’emploi, séparation, maladie, enfants à charge.',if:x=>x.rdem!=='contest'},
   {row:[{k:'ressources',l:'Ressources du foyer (€/mois)',ty:'text'},{k:'charges',l:'Charges (€/mois)',ty:'text'}],if:x=>x.rdem!=='contest'},
   {k:'foyer',l:'Composition du foyer',ty:'text',h:'Ex. : 1 adulte et 2 enfants.',if:x=>x.rdem!=='contest'},
   {k:'mensualite',l:'Mensualité que vous proposez (€)',ty:'text',if:x=>x.rdem==='echelon'}]},
  {t:'Justificatifs',photos:1,pre:()=>photosHTML(),recapRows:()=>[['Justificatifs',phCount()]],fields:[]},
  {t:'Vous',fields:SENDER()},
  {t:'Le destinataire',pre:()=>`<div class="note"><p>Recopiez l’adresse indiquée sur la décision${hasCRA()&&d.rdem==='contest'?', en précisant « Commission de recours amiable »':''}.</p></div>`,fields:RECIP('de l’organisme','Ex. : « CAF des Bouches-du-Rhône — Commission de recours amiable ».')},
  letterSigStep(),
  {t:'Votre lettre',recap:1,fields:[]}
 ],
 recapSkip:['motifs','situation'],recapMore:()=>[],
 recapBefore:()=>recoursInfo()+letterPreview(recoursObjet(),recoursParas()),
 missing(){const m=letterMissing();if(!clean1(d.ident))m.unshift('votre identifiant');if(!d.notif)m.unshift('date de la décision');if(!clean1(d.motifs)&&d.rdem==='contest')m.unshift('vos arguments');return m},
 missWarn:'Vous pouvez quand même produire le PDF, mais complétez ces informations avant de l’envoyer.',
 mailHint:'adresse indiquée sur la décision',
 recapAfter:()=>`<div class="note" style="margin-top:16px"><p><b>Pour l’envoyer :</b> par <b>lettre recommandée avec accusé de réception</b> à l’adresse indiquée sur la décision, ou par votre espace en ligne (rubrique réclamation), en joignant ce PDF. Gardez une copie et la preuve d’envoi.</p></div>`,
 fname:()=>`${d.rdem==='contest'?'Recours':'Demande_remise'}_${(d.org||'organisme').toUpperCase()}_${d.le||today}.pdf`,
 mail(){return {to:clean1(d.mailto),subj:recoursObjet(),body:`Madame, Monsieur,\n\nVeuillez trouver ci-joint ${d.rdem==='contest'?'mon recours':'ma demande'}, avec les justificatifs.\n\n${fullName()}`}},
 build(){return letterPDF({objet:recoursObjet(),paras:recoursParas(),pj:'Pièces jointes : copie de la décision et justificatifs.',ph:myPh(),annexTitle:'Pièces jointes'})}
};

/* ================= Document 18 : garantie légale de conformité ================= */
function confInfo(){
 const liv=d.livdate||d.achdate;if(!liv)return '';
 const fin=addMonths(liv,24),pres=addMonths(liv,d.occasion==='oui'?12:24),apparu=d.defdate||today;
 if(today>fin)return `<div class="note warn"><p><b>Attention : plus de 2 ans se sont écoulés depuis la livraison</b> (le ${esc(fr(fin))}). La garantie légale de conformité ne s’applique en principe plus ; une garantie commerciale ou la garantie des vices cachés peuvent encore jouer.</p></div>`;
 return `<div class="note"><p>Garantie légale de conformité : <b>jusqu’au ${esc(frLong(fin))}</b> (2 ans après la livraison).${apparu<=pres?' Le défaut étant apparu dans les '+(d.occasion==='oui'?'12':'24')+' premiers mois, il est présumé exister dès la livraison : vous n’avez pas à le prouver.':' Le défaut est apparu après la période de présomption : vous devrez montrer qu’il existait à la livraison.'}</p></div>`;
}
function confParas(){
 const L=[],p=clean1(d.produit)||'…',liv=d.livdate||d.achdate,pres=liv?addMonths(liv,d.occasion==='oui'?12:24):null,apparu=d.defdate||today;
 L.push(`Le ${fr(d.achdate)||'…'}, j’ai acheté auprès de vous le produit suivant : ${p}${clean1(d.cmdref)?` (commande ou facture n° ${clean1(d.cmdref)})`:''}${clean1(d.prix)?`, pour un prix de ${eur(num(d.prix))}`:''}${d.livdate?`, livré le ${fr(d.livdate)}`:''}.`);
 L.push(`Depuis le ${fr(d.defdate)||'…'}, ce bien présente le défaut suivant : ${clean1(d.defaut)||'…'}.`);
 L.push(`En application des articles L. 217-3 et suivants du code de la consommation, vous êtes tenu, en tant que vendeur, de livrer un bien conforme au contrat et de répondre des défauts de conformité qui apparaissent dans un délai de deux ans à compter de sa délivrance.${pres&&apparu<=pres?` Ce défaut étant apparu dans les ${d.occasion==='oui'?'douze':'vingt-quatre'} mois suivant la délivrance, il est présumé exister au moment de celle-ci (article L. 217-7).`:''}`);
 L.push(`Je vous demande donc de procéder ${d.remede==='remplacement'?'au remplacement':'à la réparation'} du bien, sans aucuns frais pour moi, dans un délai raisonnable qui ne peut excéder trente jours. À défaut, je serai en droit d’obtenir une réduction du prix ou la résolution de la vente, avec le remboursement du prix.`);
 L.push(`Je vous rappelle que cette garantie légale est due par le vendeur, indépendamment de toute garantie commerciale ou garantie du fabricant.`);
 return L;
}
const confObjet=()=>`Mise en œuvre de la garantie légale de conformité${clean1(d.cmdref)?' — commande n° '+clean1(d.cmdref):''}`;
const CONFORMITE={
 key:'attest_conformite_v1',title:'Garantie de conformité',sub:'Produit en panne ou défectueux : réparation ou remplacement',
 init:x=>{if(!x.le)x.le=today;if(!x.remede)x.remede='reparation';if(!x.occasion)x.occasion='non'},
 maxPh:4,phLabels:[],phIntro:()=>`<p>Joignez la <b>facture ou le ticket de caisse</b> et des <b>photos du défaut</b>. Elles sont ajoutées à la fin du PDF (4 au maximum).</p>`,
 phBtn:n=>n?'Ajouter une photo':'Photographier la facture',
 steps:[
  {t:'Avant de commencer',pre:()=>`<div class="note"><p><b>À quoi sert cette lettre ?</b> Un produit acheté à un professionnel (en magasin ou en ligne) tombe en panne ou ne fonctionne pas comme prévu ? Le <b>vendeur</b> doit le réparer ou le remplacer gratuitement pendant <b>2 ans</b> après la livraison : c’est la garantie légale de conformité.</p></div>
 <div class="note warn"><ul>
  <li>Adressez-vous au <b>vendeur</b>, pas au fabricant : il ne peut pas vous renvoyer vers le service après-vente de la marque.</li>
  <li>Pendant les 2 ans (1 an pour un bien d’occasion), le défaut est présumé exister dès la livraison : vous n’avez pas à le prouver.</li>
  <li>Une casse due à une chute ou à une mauvaise utilisation n’est pas couverte.</li>
  <li>Ne pas confondre avec la <b>garantie commerciale</b> (extension payante ou garantie du fabricant), qui s’ajoute à la garantie légale.</li></ul></div>`,fields:[]},
  {t:'Le produit',fields:[
   {k:'produit',l:'Produit',ty:'text',h:'Marque et modèle. Exemple : « lave-linge Bosch Série 6 WGG04409FR ».'},
   {row:[{k:'achdate',l:'Date d’achat',ty:'date'},{k:'livdate',l:'Date de livraison',ty:'date',h:'Si différente'}]},
   {row:[{k:'prix',l:'Prix (€)',ty:'text'},{k:'cmdref',l:'N° de commande ou de facture',ty:'text'}]},
   {k:'occasion',l:'Produit d’occasion ?',ty:'radio',o:YN}],
   post:()=>`<div id="cinfo">${confInfo()}</div>`,live:['achdate','livdate'],liveFn:()=>{const c=$('#cinfo');if(c)c.innerHTML=confInfo()}},
  {t:'Le défaut',fields:[
   {k:'defaut',l:'Décrivez le défaut',ty:'area',h:'Exemple : « le tambour ne tourne plus et un code erreur E18 s’affiche ».'},
   {k:'defdate',l:'Apparu le',ty:'date'},
   {k:'remede',l:'Vous demandez…',ty:'radio',o:[['reparation','La réparation'],['remplacement','Le remplacement']],h:'Le vendeur peut refuser votre choix s’il est impossible ou d’un coût disproportionné, et proposer l’autre solution.'}],
   post:()=>`<div id="cinfo2">${confInfo()}</div>`},
  {t:'Justificatifs',photos:1,pre:()=>photosHTML(),recapRows:()=>[['Justificatifs',phCount()]],fields:[]},
  {t:'Vous',fields:SENDER()},
  {t:'Le vendeur',fields:RECIP('du vendeur (magasin ou site)','Exemple : « Darty — Service clients ».')},
  letterSigStep(),
  {t:'Votre lettre',recap:1,fields:[]}
 ],
 recapSkip:['defaut'],recapMore:i=>i===2&&clean1(d.defaut)?[['Défaut',clean1(d.defaut)]]:[],
 recapBefore:()=>confInfo()+letterPreview(confObjet(),confParas()),
 missing(){const m=letterMissing();if(!clean1(d.produit))m.unshift('produit');if(!d.achdate)m.unshift('date d’achat');if(!clean1(d.defaut))m.unshift('défaut');return m},
 missWarn:'Vous pouvez quand même produire le PDF, mais complétez ces informations avant de l’envoyer.',
 mailHint:'service clients du vendeur',
 recapAfter:lrarNote,
 fname:()=>`Garantie_conformite${fnDest()}_${d.le||today}.pdf`,
 mail(){return {to:clean1(d.mailto),subj:confObjet(),body:`Madame, Monsieur,\n\nVeuillez trouver ci-joint ma demande de mise en œuvre de la garantie légale de conformité, avec la facture et des photos du défaut.\n\n${fullName()}`}},
 build(){return letterPDF({objet:confObjet(),paras:confParas(),pj:myPh().length?'Pièces jointes : facture et photos du défaut.':'',ph:myPh(),annexTitle:'Pièces jointes'})}
};

/* ================= Document 19 : révocation d'un mandat de prélèvement SEPA ================= */
const sepaBanque=()=>d.sdest==='banque';
function sepaInfo(){
 if(d.rembourse!=='oui'||!d.pdate)return '';
 const nonAut=d.smotif==='nonautorise',fin=nonAut?addMonths(d.pdate,13):isoS(new Date(isoD(d.pdate).getTime()+56*864e5));
 return `<div class="note${today>fin?' warn':''}"><p>${nonAut?'Prélèvement non autorisé : remboursement à demander dans les <b>13 mois</b>':'Prélèvement autorisé : remboursement sans condition à demander dans les <b>8 semaines</b>'} après le débit, soit au plus tard le <b>${esc(fr(fin))}</b>.${today>fin?' <b>Ce délai semble dépassé.</b>':''}</p></div>`;
}
function sepaParas(){
 const L=[],cr=clean1(d.creancier)||'…',rum=clean1(d.rum),ics=clean1(d.ics),cpt=clean1(d.compte);
 const mot={resilie:'mon contrat a pris fin',litige:'je suis en litige avec ce créancier',nonautorise:'je n’ai jamais autorisé ces prélèvements',autre:clean1(d.smotiftxt)}[d.smotif];
 if(!sepaBanque()){
  L.push(`Par la présente, je révoque le mandat de prélèvement SEPA${rum?` (référence unique de mandat ${rum})`:''} que je vous avais donné pour le prélèvement de sommes sur mon compte${cpt?` n° ${cpt}`:''}${mot?`, au motif que ${mot}`:''}.`);
  L.push(`Je vous demande en conséquence de ne plus émettre aucun prélèvement sur mon compte à compter de la réception de la présente lettre. J’informe parallèlement ma banque de cette révocation.`);
  L.push(`Je vous remercie de me confirmer par écrit la prise en compte de cette révocation.`);
 }else{
  L.push(`Je vous informe que j’ai révoqué le mandat de prélèvement SEPA${rum?` (référence unique de mandat ${rum})`:''} donné au créancier ${cr}${ics?` (identifiant créancier SEPA ${ics})`:''}${mot?`, au motif que ${mot}`:''}.`);
  L.push(`Je vous demande en conséquence de refuser tout nouveau prélèvement émis par ce créancier sur mon compte${cpt?` n° ${cpt}`:''} à compter de la réception de la présente lettre.`);
  if(d.rembourse==='oui')L.push(d.smotif==='nonautorise'
   ?`Je conteste en outre le prélèvement du ${fr(d.pdate)||'…'}${clean1(d.pmontant)?`, d’un montant de ${eur(num(d.pmontant))}`:''}, que je n’ai pas autorisé, et vous demande de me le rembourser conformément à l’article L. 133-18 du code monétaire et financier.`
   :`Je vous demande en outre de me rembourser le prélèvement du ${fr(d.pdate)||'…'}${clean1(d.pmontant)?`, d’un montant de ${eur(num(d.pmontant))}`:''}, conformément à l’article L. 133-25 du code monétaire et financier, cette demande étant présentée dans les huit semaines suivant le débit.`);
 }
 return L;
}
const sepaObjet=()=>sepaBanque()?`Opposition aux prélèvements de ${clean1(d.creancier)||'…'}${clean1(d.rum)?' — mandat '+clean1(d.rum):''}`:`Révocation du mandat de prélèvement SEPA${clean1(d.rum)?' n° '+clean1(d.rum):''}`;
const SEPA={
 key:'attest_sepa_v1',title:'Arrêter un prélèvement',sub:'Révoquer un mandat SEPA, demander le remboursement',
 init:x=>{if(!x.le)x.le=today;if(!x.sdest)x.sdest='creancier';if(!x.smotif)x.smotif='resilie';if(!x.rembourse)x.rembourse='non'},
 steps:[
  {t:'Avant de commencer',pre:()=>`<div class="note"><p><b>À quoi sert cette lettre ?</b> À arrêter des prélèvements : vous <b>révoquez le mandat</b> auprès de l’entreprise (le créancier) et vous demandez à votre <b>banque</b> de bloquer ses prélèvements. Faites les deux lettres pour plus de sûreté.</p></div>
 <div class="note warn"><ul>
  <li>Révoquer le mandat <b>n’annule pas ce que vous devez</b> : si une somme reste due, il faudra la payer autrement.</li>
  <li>Un prélèvement <b>autorisé</b> peut être remboursé sans justification dans les <b>8 semaines</b> suivant le débit ; un prélèvement <b>non autorisé</b> (sans mandat), dans les <b>13 mois</b>.</li>
  <li>Vous trouverez la <b>référence unique de mandat (RUM)</b> et l’<b>identifiant créancier SEPA (ICS)</b> sur vos relevés de compte ou sur l’échéancier du créancier.</li>
  <li>Beaucoup de banques permettent aussi de faire opposition directement dans l’appli.</li></ul></div>`,fields:[]},
  {t:'Le prélèvement',fields:[
   {k:'sdest',l:'Cette lettre est adressée…',ty:'radio',o:[['creancier','Au créancier (l’entreprise qui prélève)'],['banque','À ma banque']]},
   {k:'creancier',l:'Nom du créancier',ty:'text',h:'Tel qu’il apparaît sur vos relevés.'},
   {row:[{k:'rum',l:'Référence unique de mandat (RUM)',ty:'text',h:'Facultatif'},{k:'ics',l:'Identifiant créancier (ICS)',ty:'text',h:'Facultatif'}]},
   {k:'compte',l:'N° de compte',ty:'text',h:'Facultatif. Vous pouvez n’indiquer que les derniers chiffres.'},
   {k:'smotif',l:'Pourquoi ?',ty:'radio',o:[['resilie','Le contrat a pris fin'],['litige','Litige avec le créancier'],['nonautorise','Je n’ai jamais autorisé ces prélèvements'],['autre','Autre']]},
   {k:'smotiftxt',l:'Précisez',ty:'text',if:x=>x.smotif==='autre',sub:1},
   {k:'rembourse',l:'Demander le remboursement d’un prélèvement ?',ty:'radio',o:YN,if:x=>x.sdest==='banque'},
   {row:[{k:'pdate',l:'Date du prélèvement',ty:'date'},{k:'pmontant',l:'Montant (€)',ty:'text'}],if:x=>x.sdest==='banque'&&x.rembourse==='oui',sub:1}],
   post:()=>`<div id="sinfo">${sepaInfo()}</div>`,live:['pdate'],liveFn:()=>{const c=$('#sinfo');if(c)c.innerHTML=sepaInfo()}},
  {t:'Vous',fields:SENDER()},
  {t:'Le destinataire',pre:()=>`<div class="note"><p>${sepaBanque()?'Indiquez votre <b>banque</b> (votre agence).':'Indiquez le <b>créancier</b> (service clients ou service prélèvements).'}</p></div>`,fields:RECIP('de la banque ou du créancier','Exemple : « Banque du Sud — Agence Castellane » ou « Club Forme — Service clients ».')},
  letterSigStep(),
  {t:'Votre lettre',recap:1,fields:[]}
 ],
 recapSkip:[],recapMore:()=>[],
 recapBefore:()=>sepaInfo()+letterPreview(sepaObjet(),sepaParas()),
 missing(){const m=letterMissing();if(!clean1(d.creancier))m.unshift('nom du créancier');return m},
 missWarn:'Vous pouvez quand même produire le PDF, mais complétez ces informations avant de l’envoyer.',
 mailHint:'votre banque ou le créancier',
 recapAfter:()=>`<div class="note" style="margin-top:16px"><p>Envoyez cette lettre en <b>recommandé avec accusé de réception</b> (ou par la messagerie de votre banque). ${sepaBanque()?'Envoyez aussi la lettre de révocation au créancier : changez le destinataire à l’étape 2.':'Envoyez aussi une lettre à votre banque : changez le destinataire à l’étape 2.'}</p></div>`,
 fname:()=>`${sepaBanque()?'Opposition_prelevement':'Revocation_mandat_SEPA'}_${fnPart(d.creancier)||'creancier'}_${d.le||today}.pdf`,
 mail(){return {to:clean1(d.mailto),subj:sepaObjet(),body:`Madame, Monsieur,\n\nVeuillez trouver ci-joint ma lettre concernant le mandat de prélèvement SEPA au profit de ${clean1(d.creancier)||'…'}.\n\n${fullName()}`}},
 build(){return letterPDF({objet:sepaObjet(),paras:sepaParas()})}
};

/* ================= Document 20 : signalement d'un logement insalubre ou indigne à la mairie ================= */
const SL_URL='https://signal-logement.beta.gouv.fr/';
const DESORDRES=[['humidite','Humidité, moisissures'],['infiltrations','Infiltrations, fuites'],['chauffage','Pas de chauffage ou chauffage insuffisant'],['electricite','Installation électrique dangereuse'],['gaz','Gaz, aération insuffisante (risque de monoxyde de carbone)'],['plomb','Peintures anciennes écaillées (risque de plomb)'],['nuisibles','Nuisibles (rats, cafards, punaises de lit…)'],['eau','Pas d’eau potable ou pas d’eau chaude'],['sanitaires','WC ou salle d’eau absents ou hors d’usage'],['structure','Fissures, plafond ou escalier dangereux'],['autre','Autre']];
const desordresTxt=()=>(Array.isArray(d.desordres)?d.desordres:[]).map(v=>v==='autre'?clean1(d.desautre)||'autre désordre':((DESORDRES.find(x=>x[0]===v)||[,''])[1]).toLowerCase()).filter(Boolean);
/* Recherche de la mairie : geo.api.gouv.fr (commune) puis Annuaire de l'administration (service-public.fr) */
async function findMairie(){
 const out=$('#mairie-out'),cp=String(d.logcp||d.cp||'').replace(/\D/g,'');
 if(cp.length!==5){out.innerHTML='<div class="msg err">Indiquez d’abord le code postal du logement (étape 2).</div>';return}
 out.innerHTML='<div class="msg">Recherche de la mairie…</div>';
 try{
  const cs=await (await fetch(`https://geo.api.gouv.fr/communes?codePostal=${cp}&fields=nom,code&format=json`)).json();
  if(!cs.length)throw new Error('code postal inconnu');
  let c=cs.find(x=>x.code===d.insee)||(cs.length===1?cs[0]:cs.find(x=>clean1(d.logville).toLowerCase()===x.nom.toLowerCase()));
  if(!c){out.innerHTML=`<div class="note"><p>Plusieurs communes ont ce code postal. Laquelle ?</p>${cs.map(x=>`<button type="button" class="btn" data-insee="${x.code}" style="width:100%;margin-top:6px">${esc(x.nom)}</button>`).join('')}</div>`;return}
  d.insee=c.code;
  const q=`https://api-lannuaire.service-public.fr/api/explore/v2.1/catalog/datasets/api-lannuaire-administration/records?where=${encodeURIComponent(`code_insee_commune="${c.code}" and pivot like "mairie"`)}&limit=5&select=nom,adresse,adresse_courriel,site_internet,telephone`;
  const r=(await (await fetch(q)).json()).results||[];
  const m=r.find(x=>/^Mairie/i.test(x.nom))||r[0];if(!m)throw new Error('mairie introuvable dans l’annuaire');
  const P=s=>{try{return JSON.parse(s||'[]')}catch(e){return []}};
  const a=P(m.adresse)[0]||{},site=(P(m.site_internet)[0]||{}).valeur,tel=(P(m.telephone)[0]||{}).valeur;
  d.dnom=`Mairie ${/^[AEIOUYÉÈÊÎÔH]/i.test(c.nom)?"d’":"de "}${c.nom} — Service hygiène et logement`;d.dadr=[a.numero_voie,a.complement1,a.service_distribution].filter(Boolean).join(', ');d.dcp=a.code_postal||'';d.dville=a.nom_commune||c.nom;
  const mail=String(m.adresse_courriel||'').split(';')[0].trim();d.mailto=mail;
  d.mairieSite=site||'';d.mairieTel=tel||'';save();keepScroll();
  $('#mairie-out').innerHTML=`<div class="msg">Mairie trouvée : <b>${esc(m.nom)}</b>.${mail?' Son adresse mail est préremplie.':' L’annuaire n’indique pas d’adresse mail : utilisez le formulaire de contact du site'+(site?` (<a href="${esc(site)}" target="_blank" rel="noopener">${esc(site)}</a>)`:'')+(tel?` ou appelez le ${esc(tel)}`:'')+', ou envoyez la lettre par courrier.'}</div>`;
 }catch(e){out.innerHTML=`<div class="msg err">Recherche impossible (${esc(e.message||e)}). Vérifiez la connexion, ou saisissez l’adresse de la mairie vous-même.</div>`}
}
document.addEventListener('click',e=>{const f=e.target.closest('#findmairie');if(f){findMairie();return}const i=e.target.closest('[data-insee]');if(i){d.insee=i.dataset.insee;save();findMairie()}});
function insalubreParas(){
 const L=[],des=desordresTxt(),qual={loc:'locataire',po:'propriétaire occupant',voisin:'voisin',autre:'tiers'}[d.lqual]||'occupant';
 L.push(`Je vous signale la situation du logement situé ${clean1(d.logadr)||'…'}${[d.logcp,d.logville].map(clean1).filter(Boolean).length?', '+[d.logcp,d.logville].map(clean1).filter(Boolean).join(' '):''}${clean1(d.etage)?` (${clean1(d.etage)})`:''}, ${d.lqual==='voisin'||d.lqual==='autre'?`dont je suis ${qual}`:`que j’occupe en qualité de ${qual}`}${clean1(d.occupants)?`, et où vivent ${clean1(d.occupants)}`:''}.`);
 L.push(`Ce logement présente, depuis ${d.depuis?'le '+fr(d.depuis):'plusieurs mois'}, les désordres suivants : ${des.length?des.join(' ; '):'…'}.${clean1(d.desdetails)?' '+clean1(d.desdetails).replace(/\.?$/,'.'):''}`);
 if(d.enfants==='oui')L.push(`Des enfants vivent dans ce logement${d.vulnerable==='oui'?', ainsi que des personnes âgées, malades ou en situation de handicap':''}.`);
 else if(d.vulnerable==='oui')L.push(`Des personnes âgées, malades ou en situation de handicap vivent dans ce logement.`);
 if(d.proprio==='ecrit')L.push(`J’ai informé le propriétaire${clean1(d.bailleur)?` (${clean1(d.bailleur)})`:''} par écrit${d.pdate?' le '+fr(d.pdate):''}, sans que les travaux nécessaires aient été réalisés.`);
 else if(d.proprio==='oral')L.push(`J’ai signalé ces désordres oralement au propriétaire${clean1(d.bailleur)?` (${clean1(d.bailleur)})`:''}, sans résultat.`);
 L.push(`Ces désordres me paraissent porter atteinte à la santé et à la sécurité des occupants. Je vous demande de bien vouloir faire procéder à une visite du logement par vos services et, le cas échéant, d’engager les procédures prévues par le code de la construction et de l’habitation (police de la sécurité et de la salubrité des immeubles, articles L. 511-1 et suivants).`);
 L.push(`${myPh().length?`Vous trouverez en annexe ${myPh().length} photo${myPh().length>1?'s':''} du logement. `:''}Je reste à votre disposition pour permettre l’accès au logement${clean1(d.tel)?' (téléphone : '+clean1(d.tel)+')':''}.`);
 return L;
}
const insalubreObjet=()=>`Signalement d’un logement insalubre ou indigne — ${[clean1(d.logadr),clean1(d.logville)].filter(Boolean).join(', ')||'…'}`;
const INSALUBRE={
 key:'attest_insalubre_v1',title:'Signaler un logement insalubre',sub:'Lettre à la mairie avec photos',
 init:x=>{if(!x.le)x.le=today;if(!x.lqual)x.lqual='loc';if(!x.proprio)x.proprio='non'},
 maxPh:10,phLabels:[],phIntro:()=>`<p>Photographiez chaque problème de près et de loin : moisissures, infiltrations, installation électrique, fissures, nuisibles… Les photos sont ajoutées à la fin du PDF (10 au maximum). Elles sont souvent décisives.</p>`,
 phBtn:n=>n?'Ajouter une photo':'Photographier le premier problème',
 steps:[
  {t:'Avant de commencer',pre:()=>`<div class="note"><p><b>À quoi sert ce document ?</b> À signaler à la <b>mairie</b> (service hygiène ou logement) un logement qui met en danger la santé ou la sécurité de ses occupants : humidité, moisissures, électricité dangereuse, absence de chauffage, nuisibles…</p></div>
 <div class="note warn"><ul>
  <li><b>Danger immédiat</b> (odeur de gaz, fils électriques à nu, plafond qui s’effondre) : appelez le <b>18</b> ou le <b>112</b>.</li>
  <li>Si vous êtes locataire, écrivez d’abord au propriétaire pour lui demander les travaux${ONLY?'':' (document « Demande de travaux au propriétaire »)'} ; <b>continuez à payer votre loyer</b>.</li>
  <li>Si vous touchez une aide au logement, signalez aussi la situation à la CAF ou à la MSA : l’aide peut être conservée pendant les travaux.</li></ul></div>${ONLY?`<p class="indep"><b>Application indépendante</b>, éditée par Vitfix. Elle n’est ni éditée ni validée par l’administration. Vos informations restent sur votre téléphone : rien n’est envoyé sans votre action.</p>`:''}`,fields:[]},
  {t:'Le logement',fields:[
   {k:'logadr',l:'Adresse du logement',ty:'text'},
   {row:[{k:'logcp',l:'Code postal',ty:'tel'},{k:'logville',l:'Commune',ty:'text'}]},
   {k:'etage',l:'Étage, n° d’appartement',ty:'text',h:'Facultatif.'},
   {k:'lqual',l:'Vous êtes…',ty:'radio',o:[['loc','Locataire'],['po','Propriétaire occupant'],['voisin','Voisin, proche, travailleur social…'],['autre','Autre']]},
   {k:'occupants',l:'Qui vit dans le logement ?',ty:'text',h:'Exemple : « 2 adultes et 3 enfants ».'},
   {row:[{k:'enfants',l:'Des enfants ?',ty:'radio',o:YN},{k:'vulnerable',l:'Personnes âgées, malades ou handicapées ?',ty:'radio',o:YN}]}]},
  {t:'Les problèmes',fields:[
   {k:'desordres',l:'Cochez tous les problèmes constatés',ty:'check',o:DESORDRES},
   {k:'desautre',l:'Quel autre problème ?',ty:'text',if:x=>Array.isArray(x.desordres)&&x.desordres.includes('autre'),sub:1},
   {k:'desdetails',l:'Précisions',ty:'area',h:'Pièces concernées, conséquences sur la santé (asthme, allergies…), aggravation.'},
   {k:'depuis',l:'Depuis quand ?',ty:'date'}]},
  {t:'Le propriétaire',fields:[
   {k:'bailleur',l:'Nom du propriétaire ou de l’agence',ty:'text',h:'Facultatif.'},
   {k:'proprio',l:'L’avez-vous informé ?',ty:'radio',o:[['ecrit','Oui, par écrit'],['oral','Oui, oralement'],['non','Non']]},
   {k:'pdate',l:'Date du courrier',ty:'date',if:x=>x.proprio==='ecrit',sub:1}]},
  {t:'Photos',photos:1,pre:()=>photosHTML(),recapRows:()=>[['Photos',phCount()]],fields:[]},
  {t:'Vous',fields:SENDER()},
  {t:'La mairie',pre:()=>`<div class="note"><p>L’appli trouve la mairie du logement dans l’annuaire officiel de l’administration (service-public.fr).</p><button type="button" class="btn pri" id="findmairie" style="width:100%;margin-top:6px">Trouver la mairie du logement</button><div id="mairie-out" style="margin-top:8px"></div></div>`,fields:RECIP('du service (mairie)','Rempli automatiquement par la recherche ; vous pouvez le modifier.')},
  letterSigStep(),
  {t:'Votre signalement',recap:1,fields:[]}
 ],
 recapSkip:['desdetails'],recapMore:()=>[],
 recapBefore:()=>letterPreview(insalubreObjet(),insalubreParas()),
 missing(){const m=letterMissing();if(!clean1(d.logadr))m.unshift('adresse du logement');if(!desordresTxt().length)m.unshift('problèmes constatés');if(!myPh().length)m.push('photos');return m},
 missWarn:'Vous pouvez quand même produire le PDF, mais des photos et une description précise rendent le signalement plus efficace.',
 mailHint:'adresse mail de la mairie',
 recapAfter:()=>`<div class="note" style="margin-top:16px"><p><b>Pour l’envoyer :</b> « Envoyer par mail » ouvre un mail à la mairie avec le PDF et les photos joints${d.mairieSite?` ; si la mairie préfère son formulaire en ligne, utilisez son site (<a href="${esc(d.mairieSite)}" target="_blank" rel="noopener">${esc(d.mairieSite)}</a>) en joignant le PDF`:''}. Vous pouvez aussi l’envoyer en recommandé.</p><p style="font-size:13px;color:var(--mute);margin-top:8px">Vous pouvez aussi faire un signalement sur <a href="${SL_URL}" target="_blank" rel="noopener">Signal Logement</a>, le service en ligne de l’État.</p></div>`,
 fname:()=>`Signalement_logement_${fnPart(d.logville)||'commune'}_${d.le||today}.pdf`,
 mail(){return {to:clean1(d.mailto),subj:insalubreObjet(),body:`Madame, Monsieur,\n\nVeuillez trouver ci-joint le signalement d’un logement insalubre ou indigne situé ${[clean1(d.logadr),clean1(d.logcp),clean1(d.logville)].filter(Boolean).join(' ')}, avec des photos en annexe.\n\nJe reste à votre disposition pour une visite.\n\n${fullName()}${clean1(d.tel)?'\n'+clean1(d.tel):''}`}},
 build(){return letterPDF({objet:insalubreObjet(),paras:insalubreParas(),rec:false,pj:myPh().length?`Pièces jointes : ${myPh().length} photo${myPh().length>1?'s':''} du logement.`:'',ph:myPh(),annexTitle:'Photos du logement'})}
};

/* ================= Document 21 : restitution du dépôt de garantie (locataire → bailleur) ================= */
// Art. 22 loi 89-462 : 1 mois (EDL de sortie conforme) ou 2 mois, à compter de la remise des clés ; majoration 10 % du loyer mensuel HC par mois de retard commencé
const moisRetard=(lim,ref)=>{if(!lim||!ref||ref<=lim)return 0;let m=0;while(addMonths(lim,m)<ref&&m<240)m++;return m};
function depotCalc(){
 const mois=d.conforme==='non'?2:1,lim=addMonths(d.cles,mois),dep=num(d.depot),loyer=num(d.loyer),deja=num(d.deja)>0?num(d.deja):0;
 const reste=isFinite(dep)?Math.max(0,Math.round((dep-deja)*100)/100):NaN,m=moisRetard(lim,today),maj=m&&isFinite(loyer)?Math.round(loyer*0.1*m*100)/100:0;
 return {mois,lim,dep,loyer,deja,reste,m,maj,du:isFinite(reste)?Math.round((reste+maj)*100)/100:NaN};
}
function depotInfo(){
 const c=depotCalc();
 if(!d.cles)return `<div class="note"><p>Indiquez la date de remise des clés : l’appli calcule la date limite de restitution.</p></div>`;
 let h=`<p><b>Date limite de restitution : ${esc(frLong(c.lim))}</b> (${c.mois} mois après la remise des clés du ${esc(fr(d.cles))}${d.conforme==='non'?', état des lieux de sortie différent de celui d’entrée':d.conforme==='oui'?', état des lieux de sortie conforme':''}).</p>`;
 if(!d.conforme)h+=`<p>Précisez si l’état des lieux de sortie est conforme à celui d’entrée : sinon, le délai est de 2 mois.</p>`;
 if(c.m)h+=`<p><b>Le délai est dépassé.</b> ${c.m} mois de retard commencé${c.m>1?'s':''} : majoration de 10 % du loyer hors charges par mois${isFinite(c.loyer)?`, soit <b>${eur(c.maj)}</b>`:' (indiquez le loyer hors charges pour la calculer)'}${isFinite(c.du)?`. Somme à réclamer : <b>${eur(c.du)}</b>`:''}. La majoration n’est pas due si le retard vient de ce que vous n’avez pas donné votre nouvelle adresse.</p>`;
 return `<div class="note${c.m?' warn':''}">${h}</div>`;
}
function depotParas(){
 const c=depotCalc(),L=[],adr=[clean1(d.adr),[clean1(d.cp),clean1(d.ville)].filter(Boolean).join(' ')].filter(Boolean).join(', ');
 L.push(`J’ai été locataire du logement situé ${clean1(d.logadr)||'…'}${d.entree?`, du ${fr(d.entree)}`:''}${d.sortie?` au ${fr(d.sortie)}`:''}. ${d.sortie?`L’état des lieux de sortie a été établi le ${fr(d.sortie)} et j`:'J'}e vous ai remis les clés le ${fr(d.cles)||'…'}.`);
 L.push(d.conforme==='non'
  ?`En application de l’article 22 de la loi n° 89-462 du 6 juillet 1989, vous disposez d’un délai de deux mois à compter de la remise des clés, soit jusqu’au ${fr(c.lim)||'…'}, pour me restituer le dépôt de garantie de ${isFinite(c.dep)?eur(c.dep):'…'}, déduction faite des seules sommes restant dues dont vous pourrez justifier (devis, factures).`
  :`L’état des lieux de sortie étant conforme à l’état des lieux d’entrée, vous disposez, en application de l’article 22 de la loi n° 89-462 du 6 juillet 1989, d’un délai d’un mois à compter de la remise des clés, soit jusqu’au ${fr(c.lim)||'…'}, pour me restituer le dépôt de garantie de ${isFinite(c.dep)?eur(c.dep):'…'}.`);
 if(c.deja)L.push(`Vous m’avez déjà restitué ${eur(c.deja)} ; il reste donc ${isFinite(c.reste)?eur(c.reste):'…'} à me verser.`);
 if(c.m)L.push(`Ce délai est expiré. Je vous rappelle qu’à défaut de restitution dans le délai prévu, le dépôt de garantie restant dû est majoré d’une somme égale à 10 % du loyer mensuel hors charges${isFinite(c.loyer)?` (${eur(c.loyer)})`:''} pour chaque période mensuelle commencée en retard. À ce jour, ${c.m} mois de retard ${c.m>1?'sont commencés':'est commencé'}, soit une majoration de ${isFinite(c.loyer)?eur(c.maj):'…'}. Je vous demande donc de me verser la somme de ${isFinite(c.du)?eur(c.du):'…'} dans un délai de huit jours à compter de la réception de la présente lettre.`);
 else L.push(`Je vous remercie de me restituer cette somme au plus tard le ${fr(c.lim)||'…'}. À défaut, le dépôt de garantie restant dû sera majoré de 10 % du loyer mensuel hors charges pour chaque mois de retard commencé (même article).`);
 L.push(clean1(d.iban)?`Vous pouvez effectuer le versement par virement sur mon compte (IBAN ${clean1(d.iban)}). Pour tout courrier, ma nouvelle adresse est : ${adr||'…'}.`:`Je vous rappelle ma nouvelle adresse : ${adr||'…'}. Vous pouvez m’y adresser le règlement, ou me demander mes coordonnées bancaires pour un virement.`);
 L.push(`Si vous entendez retenir une partie du dépôt de garantie, je vous remercie de m’en communiquer le détail et les justificatifs. À défaut de restitution, je me réserve la possibilité de saisir la commission départementale de conciliation ou un conciliateur de justice, puis le juge des contentieux de la protection.`);
 return L;
}
const depotObjet=()=>`Restitution du dépôt de garantie${clean1(d.logadr)?' — logement situé '+clean1(d.logadr):''}`;
const DEPOT={
 key:'attest_depot_v1',title:'Restitution du dépôt de garantie',sub:'Le locataire réclame sa caution au bailleur',
 init:x=>{if(!x.le)x.le=today},
 maxPh:3,phLabels:[],phIntro:()=>`<p>Joignez si possible les <b>états des lieux d’entrée et de sortie</b> (la page des signatures suffit) et, si vous voulez être payé par virement, votre <b>RIB</b>. Les photos sont ajoutées à la fin du PDF (3 au maximum).</p>`,
 phBtn:n=>n?'Ajouter une autre page':'Photographier l’état des lieux',
 steps:[
  {t:'Avant de commencer',pre:()=>`<div class="note"><p><b>À quoi sert cette lettre ?</b> À réclamer au propriétaire (ou à l’agence) le <b>dépôt de garantie</b> (la « caution ») que vous avez versé à l’entrée dans le logement.</p></div>
 <div class="note warn"><ul>
  <li>Le bailleur doit le rendre dans un délai de <b>1 mois</b> si l’état des lieux de sortie est conforme à celui d’entrée, <b>2 mois</b> sinon, à compter de la <b>remise des clés</b> (article 22 de la loi du 6 juillet 1989).</li>
  <li>En cas de retard, la somme due est <b>majorée de 10 % du loyer mensuel hors charges pour chaque mois de retard commencé</b>, sauf si le retard vient de ce que vous n’avez pas donné votre nouvelle adresse.</li>
  <li>Le bailleur peut retenir des sommes qui restent dues (loyers, réparations), à condition de les justifier.</li>
  <li>Sans réponse : pour un litige de moins de 5 000 €, une démarche amiable (conciliateur de justice, commission départementale de conciliation ou médiateur) est obligatoire avant de saisir le juge.</li></ul></div>`,fields:[]},
  {t:'Le logement',fields:[
   {k:'logadr',l:'Adresse du logement que vous avez quitté',ty:'text',h:'Avec l’étage ou le n° d’appartement.'},
   {row:[{k:'entree',l:'Date d’entrée',ty:'date',h:'Facultatif'},{k:'sortie',l:'État des lieux de sortie',ty:'date'}]},
   {k:'cles',l:'Date de remise des clés',ty:'date',h:'C’est elle qui fait courir le délai.'},
   {k:'conforme',l:'L’état des lieux de sortie est-il conforme à celui d’entrée ?',ty:'radio',o:[['oui','Oui, pas de différence'],['non','Non, des différences sont notées']]}],
   post:()=>`<div id="dinfo">${depotInfo()}</div>`,live:['cles'],liveFn:()=>{const c=$('#dinfo');if(c)c.innerHTML=depotInfo()}},
  {t:'Les montants',fields:[
   {row:[{k:'depot',l:'Dépôt de garantie versé (€)',ty:'text'},{k:'loyer',l:'Loyer mensuel hors charges (€)',ty:'text'}]},
   {k:'deja',l:'Somme déjà rendue par le bailleur (€)',ty:'text',h:'Facultatif : seulement s’il vous a rendu une partie.'},
   {k:'iban',l:'Votre IBAN, pour un virement',ty:'text',h:'Facultatif. Vous pouvez aussi joindre une photo de votre RIB.'}],
   post:()=>`<div id="dinfo2">${depotInfo()}</div>`,live:['depot','loyer','deja'],liveFn:()=>{const c=$('#dinfo2');if(c)c.innerHTML=depotInfo()}},
  {t:'Vous, l’ancien locataire',pre:()=>`<div class="note"><p>Indiquez votre <b>nouvelle adresse</b> : c’est là que le bailleur doit vous écrire et vous rendre le dépôt.</p></div>`,fields:SENDER()},
  {t:'Pièces jointes',photos:1,pre:()=>photosHTML(),recapRows:()=>[['Pièces jointes',phCount()]],fields:[]},
  {t:'Le bailleur',fields:RECIP('du propriétaire ou de l’agence','Exemple : « M. Jean DUPONT » ou « Agence Immo Sud ».')},
  letterSigStep(),
  {t:'Votre lettre',recap:1,fields:[]}
 ],
 recapSkip:[],recapMore:()=>[],
 recapBefore:()=>depotInfo()+letterPreview(depotObjet(),depotParas()),
 missing(){const m=letterMissing();if(!d.cles)m.unshift('date de remise des clés');if(!isFinite(num(d.depot)))m.unshift('montant du dépôt');if(!clean1(d.logadr))m.unshift('adresse du logement');return m},
 missWarn:'Vous pouvez quand même produire le PDF, mais complétez ces informations avant de l’envoyer.',
 mailHint:'mail du propriétaire ou de l’agence',
 recapAfter:lrarNote,
 fname:()=>`Restitution_depot_garantie${fnDest()}_${d.le||today}.pdf`,
 mail(){return {to:clean1(d.mailto),subj:depotObjet(),body:`Madame, Monsieur,\n\nVeuillez trouver ci-joint ma demande de restitution du dépôt de garantie, qui vous est également adressée par courrier recommandé avec accusé de réception.\n\n${fullName()}`}},
 build(){return letterPDF({objet:depotObjet(),paras:depotParas(),pj:myPh().length?'Pièces jointes : états des lieux et relevé d’identité bancaire.':'',ph:myPh(),annexTitle:'Pièces jointes'})}
};

/* ================= Document 22 : lettre de démission (salarié en CDI → employeur) ================= */
const PREAV=[['1s','1 semaine'],['2s','2 semaines'],['1m','1 mois'],['2m','2 mois'],['3m','3 mois'],['autre','Autre durée'],['nsp','Je ne sais pas']];
const preavTxt=()=>d.preav==='autre'?clean1(d.preavtxt):d.preav&&d.preav!=='nsp'?(PREAV.find(x=>x[0]===d.preav)||[,''])[1]:'';
function demCalc(){
 const p=d.preav||'',n=parseInt(p),fin=!d.notif||!n?null:p.endsWith('s')?isoS(new Date(isoD(d.notif).getTime()+7*n*864e5)):addMonths(d.notif,n);
 return {fin};
}
function demInfo(){
 const c=demCalc(),t=preavTxt();
 if(!t)return `<div class="note"><p><b>Durée du préavis :</b> la loi ne la fixe pas. Elle est prévue par votre <b>convention collective</b> (son nom figure sur votre bulletin de paie), sinon par votre <b>contrat de travail</b> ou les usages. En cas de doute, demandez au service du personnel ou à Allô Service Public (39 39).</p></div>`;
 return `<div class="note"><p><b>Préavis : ${esc(t)}</b>, à compter de la ${d.mode==='lrar'?'première présentation de la lettre recommandée':'remise de la lettre'}${d.notif?` (le ${esc(fr(d.notif))})`:''}.${c.fin?` Fin du préavis à titre indicatif : vers le <b>${esc(frLong(c.fin))}</b> (à confirmer avec votre employeur : congés, arrêt maladie ou accord de dispense peuvent la modifier).`:''}</p></div>`;
}
const demHead=()=>d.mode==='lrar'?'Lettre recommandée avec accusé de réception':'Lettre remise en main propre contre décharge';
function demParas(){
 const L=[],t=preavTxt(),e=eLE();
 L.push(`Par la présente, je vous informe de ma décision de démissionner de mon poste${clean1(d.poste)?` de ${clean1(d.poste)}`:''}, que j’occupe au sein de votre entreprise${d.embauche?` depuis le ${fr(d.embauche)}`:''}.`);
 if(t)L.push(`Mon préavis, d’une durée de ${t}${clean1(d.ccn)?`, conformément à la convention collective ${clean1(d.ccn)}`:', conformément aux dispositions qui me sont applicables'}, commencera à courir à compter de la ${d.mode==='lrar'?'première présentation de la présente lettre':'remise de la présente lettre'}.`);
 else L.push(`J’effectuerai le préavis prévu par ${clean1(d.ccn)?`la convention collective ${clean1(d.ccn)}`:'la convention collective ou, à défaut, mon contrat de travail'}, qui commencera à courir à compter de la ${d.mode==='lrar'?'première présentation de la présente lettre':'remise de la présente lettre'}.`);
 if(d.dispense==='oui')L.push(`Je souhaiterais toutefois être dispensé${e} de ${d.depart?'tout ou partie de ':''}ce préavis${d.depart?` et quitter l’entreprise le ${fr(d.depart)}`:''}. Si vous en êtes d’accord, je vous remercie de me le confirmer par écrit ; je sais que, dans ce cas, la période de préavis non effectuée ne me sera pas rémunérée.`);
 L.push(`À l’issue de mon contrat, je vous remercie de me remettre mon certificat de travail, mon reçu pour solde de tout compte et mon attestation destinée à France Travail, ainsi que les sommes qui me restent dues (salaire, indemnité de congés payés non pris).`);
 return L;
}
const demObjet=()=>`Démission${clean1(d.poste)?' — poste de '+clean1(d.poste):''}`;
const DEMISSION={
 key:'attest_demission_v1',title:'Lettre de démission',sub:'Salarié en CDI : la lettre à l’employeur',
 init:x=>{if(!x.le)x.le=today;if(!x.mode)x.mode='main';if(!x.dispense)x.dispense='non';if(!x.notif)x.notif=today},
 steps:[
  {t:'Avant de commencer',pre:()=>`<div class="note"><p><b>À quoi sert cette lettre ?</b> Un salarié en <b>CDI</b> qui veut quitter son emploi informe son employeur de sa démission. Aucune forme n’est imposée par la loi, mais un écrit clair évite les litiges : <b>remise en main propre contre décharge</b> ou <b>lettre recommandée avec accusé de réception</b>.</p></div>
 <div class="note warn"><ul>
  <li><b>Démissionner ne donne en principe pas droit au chômage</b> (allocation d’aide au retour à l’emploi). Exceptions : certaines <b>démissions jugées légitimes</b> par France Travail (par exemple pour suivre son conjoint qui déménage pour son travail, ou salaire non payé), et la démission pour un <b>projet de reconversion professionnelle</b> validé <b>avant</b> la démission. Renseignez-vous auprès de <b>France Travail</b> avant d’envoyer la lettre.</li>
  <li>La démission est <b>définitive</b> : vous ne pouvez revenir dessus que si l’employeur l’accepte.</li>
  <li>Le <b>préavis</b> est en principe obligatoire ; sa durée dépend de la convention collective, du contrat ou des usages. Une <b>dispense</b> à votre demande suppose l’accord de l’employeur, et le préavis non effectué n’est alors pas payé.</li>
  <li>Cette lettre ne convient pas pour un CDD, une période d’essai ou un agent public (règles différentes).</li></ul></div>`,fields:[]},
  {t:'Votre emploi',fields:[
   {k:'poste',l:'Votre poste',ty:'text',h:'Exemple : « vendeuse », « technicien de maintenance ».'},
   {k:'embauche',l:'Date d’embauche',ty:'date',h:'Facultatif.'},
   {k:'ccn',l:'Convention collective',ty:'text',h:'Facultatif. Son nom figure sur votre bulletin de paie (exemple : « du commerce de détail et de gros à prédominance alimentaire »).'},
   {k:'preav',l:'Durée de votre préavis',ty:'radio',o:PREAV,h:'La loi ne la fixe pas : elle figure dans votre convention collective, sinon dans votre contrat de travail.'},
   {k:'preavtxt',l:'Quelle durée ?',ty:'text',h:'Exemple : « 15 jours », « 1 mois et demi ».',if:x=>x.preav==='autre',sub:1}],
   post:()=>`<div id="dminfo">${demInfo()}</div>`},
  {t:'Remise de la lettre',fields:[
   {k:'mode',l:'Comment allez-vous la remettre ?',ty:'radio',o:[['main','En main propre, contre décharge'],['lrar','Lettre recommandée avec accusé de réception']]},
   {k:'notif',l:'Date de remise (ou de présentation prévue)',ty:'date',h:'En recommandé, le préavis part de la première présentation de la lettre : comptez 2 à 3 jours après l’envoi.'},
   {k:'dispense',l:'Demander à être dispensé du préavis ?',ty:'radio',o:YN,h:'L’employeur peut refuser.'},
   {k:'depart',l:'Date de départ souhaitée',ty:'date',if:x=>x.dispense==='oui',sub:1,h:'Facultatif.'}],
   post:()=>`<div id="dminfo2">${demInfo()}</div>`,live:['notif','preavtxt'],liveFn:()=>{const c=$('#dminfo2');if(c)c.innerHTML=demInfo()}},
  {t:'Vous, le salarié',fields:SENDER()},
  {t:'L’employeur',fields:RECIP('de l’employeur (entreprise)','Exemple : « SARL Boulangerie du Port — Service des ressources humaines ».')},
  letterSigStep(),
  {t:'Votre lettre',recap:1,fields:[]}
 ],
 recapSkip:[],recapMore:()=>[],
 recapBefore:()=>demInfo()+letterPreview(demObjet(),demParas()),
 missing(){const m=letterMissing();if(!clean1(d.poste))m.unshift('votre poste');if(!d.notif)m.push('date de remise');return m},
 missWarn:'Vous pouvez quand même produire le PDF, mais complétez ces informations avant de le remettre.',
 mailHint:'mail de l’employeur ou des ressources humaines',
 recapAfter:()=>`<div class="note" style="margin-top:16px"><p>${d.mode==='lrar'?'<b>Pour avoir une preuve :</b> imprimez le PDF et envoyez-le en <b>lettre recommandée avec accusé de réception</b>. Le mail seul ne prouve pas la date.':'<b>En main propre :</b> imprimez la lettre en deux exemplaires ; faites dater et signer la décharge en bas de page par l’employeur sur votre exemplaire, et gardez-le.'}</p></div>`,
 fname:()=>`Lettre_demission${fnDest()}_${d.le||today}.pdf`,
 mail(){return {to:clean1(d.mailto),subj:demObjet(),body:`Madame, Monsieur,\n\nVeuillez trouver ci-joint ma lettre de démission, qui vous est également ${d.mode==='lrar'?'adressée par courrier recommandé avec accusé de réception':'remise en main propre'}.\n\n${fullName()}`}},
 build(){return letterPDF({objet:demObjet(),head:demHead(),paras:demParas(),after:d.mode==='lrar'?[]:['Reçu en main propre le ____ / ____ / ________','Signature de l’employeur :']})}
};

/* ================= Document 23 : réclamation pour frais bancaires (client → banque) ================= */
const FTYPES=[['ci','Commissions d’intervention'],['rejetp','Frais de rejet de prélèvement ou de virement'],['rejetc','Frais de chèque rejeté'],['agios','Agios (intérêts du découvert)'],['lettre','Frais de lettre d’information'],['autre','Autres frais']];
const FRMOT=[['plafond','Les frais dépassent les plafonds légaux'],['fragile','Je suis en situation de fragilité financière'],['repete','Frais facturés plusieurs fois pour le même rejet'],['erreur','Frais dus à une erreur de la banque ou à un retard qui ne vient pas de moi'],['info','Je n’ai pas été prévenu du montant des frais à l’avance'],['geste','Difficulté passagère : je demande un geste commercial']];
const has=(k,v)=>Array.isArray(d[k])&&d[k].includes(v);
const fraisLines=()=>String(d.flignes||'').split('\n').map(clean1).filter(Boolean);
function fraisParas(){
 const L=[],lines=fraisLines(),tot=num(d.ftotal),types=(d.ftypes||[]).map(v=>(FTYPES.find(x=>x[0]===v)||[,''])[1].toLowerCase()).filter(Boolean);
 L.push(`Titulaire du compte${clean1(d.fcompte)?` n° ${clean1(d.fcompte)}`:''} dans votre établissement, je conteste les frais prélevés sur ce compte${types.length?` (${types.join(', ')})`:''}${lines.length?` : ${lines.join(' ; ')}`:''}${isFinite(tot)?`, pour un total de ${eur(tot)}`:''}.`);
 if(has('fmot','plafond'))L.push(`Or les commissions d’intervention ne peuvent dépasser 8 € par opération et 80 € par mois (article R. 312-4-1 du code monétaire et financier). Les frais de rejet d’un prélèvement ou d’un virement ne peuvent dépasser ni le montant de l’opération rejetée ni 20 €, et les frais pour un chèque rejeté sont limités à 30 € pour un chèque de 50 € ou moins et à 50 € au-delà.`);
 if(has('fmot','fragile'))L.push(d.offre==='oui'
  ?`Je bénéficie de l’offre spécifique destinée à la clientèle en situation de fragilité financière : les commissions d’intervention sont alors limitées à 4 € par opération et 20 € par mois (article R. 312-4-2 du code monétaire et financier), et l’ensemble des frais d’incidents bancaires à 20 € par mois et 200 € par an.`
  :`Ma situation correspond à celle d’un client en situation de fragilité financière. Dans ce cas, l’ensemble des frais d’incidents bancaires, commissions d’intervention comprises, est plafonné à 25 € par mois. Je vous demande de m’appliquer ce plafond et de me proposer l’offre spécifique destinée à cette clientèle.`);
 if(has('fmot','repete'))L.push(`Un même prélèvement ou virement présenté à nouveau après un premier rejet ne doit pas donner lieu à de nouveaux frais.`);
 if(has('fmot','erreur'))L.push(`Ces frais résultent d’une situation dont je ne suis pas responsable.`);
 if(has('fmot','info'))L.push(`Je n’ai pas reçu l’information sur le montant de ces frais, qui doit m’être communiquée au moins 14 jours avant leur prélèvement.`);
 if(has('fmot','geste'))L.push(`Je traverse actuellement une difficulté passagère et vous demande, à titre commercial, de bien vouloir me rembourser ces frais.`);
 if(clean1(d.fdetails))L.push(`Précisions : ${clean1(d.fdetails)}${/[.!?]$/.test(clean1(d.fdetails))?'':'.'}`);
 L.push(`Je vous demande donc de me rembourser ${isFinite(tot)?`la somme de ${eur(tot)}`:'ces frais'} dans les meilleurs délais, et de m’indiquer par écrit la suite donnée à cette réclamation.`);
 L.push(`À défaut de réponse satisfaisante dans un délai de deux mois, je saisirai le médiateur de votre établissement (article L. 316-1 du code monétaire et financier) ; je vous remercie de m’indiquer ses coordonnées.`);
 return L;
}
const fraisObjet=()=>`Réclamation — remboursement de frais bancaires${clean1(d.fcompte)?' (compte n° '+clean1(d.fcompte)+')':''}`;
const FRAIS={
 key:'attest_frais_v1',title:'Réclamation frais bancaires',sub:'Demander le remboursement de frais injustifiés',
 init:x=>{if(!x.le)x.le=today;if(!x.ftypes)x.ftypes=[];if(!x.fmot)x.fmot=[]},
 maxPh:3,phLabels:[],phIntro:()=>`<p>Joignez si possible le <b>relevé de compte</b> (ou une capture de l’appli bancaire) où figurent les frais contestés. Les photos sont ajoutées à la fin du PDF (3 au maximum).</p>`,
 phBtn:n=>n?'Ajouter un relevé':'Photographier le relevé',
 steps:[
  {t:'Avant de commencer',pre:()=>`<div class="note"><p><b>À quoi sert cette lettre ?</b> À demander à votre banque de rembourser des frais que vous estimez injustifiés : commissions d’intervention, frais de rejet, agios, frais de lettre…</p></div>
 <div class="note warn"><ul>
  <li><b>Commissions d’intervention</b> (frais facturés quand la banque examine une opération qui dépasse votre découvert) : au plus <b>8 € par opération et 80 € par mois</b> (article R. 312-4-1 du code monétaire et financier).</li>
  <li><b>Clientèle en situation de fragilité financière</b> : frais d’incidents plafonnés à <b>25 € par mois</b>, commissions d’intervention comprises. Avec l’<b>offre spécifique</b> (3 € par mois au plus) : commissions d’intervention limitées à <b>4 € par opération et 20 € par mois</b>, frais d’incidents à 20 € par mois et 200 € par an.</li>
  <li><b>Rejet de prélèvement ou de virement</b> : 20 € au plus, et jamais plus que le montant rejeté. <b>Chèque sans provision</b> : 30 € au plus (chèque de 50 € ou moins), 50 € au-delà.</li>
  <li>La banque doit vous informer du montant des frais <b>au moins 14 jours avant</b> de les prélever (en général, en bas du relevé).</li>
  <li>Écrivez d’abord à votre conseiller ou au service client. <b>Sans réponse dans les 2 mois</b>, ou si la réponse ne vous convient pas, saisissez le <b>médiateur de la banque</b> (gratuit ; ses coordonnées figurent sur la réponse, la convention de compte ou le site de la banque).</li></ul></div>`,fields:[]},
  {t:'Les frais contestés',fields:[
   {k:'ftypes',l:'Quels frais ?',ty:'check',o:FTYPES},
   {k:'flignes',l:'Une ligne par frais : date, libellé, montant',ty:'area',h:'Exemple : « 05/11/2026 — commission d’intervention — 8 € ». Facultatif, mais conseillé.'},
   {row:[{k:'ftotal',l:'Montant total réclamé (€)',ty:'text'},{k:'fcompte',l:'N° de compte',ty:'text',h:'Facultatif. Les derniers chiffres suffisent.'}]}]},
  {t:'Pourquoi les contester ?',fields:[
   {k:'fmot',l:'Cochez ce qui correspond à votre situation',ty:'check',o:FRMOT},
   {k:'offre',l:'Avez-vous souscrit l’offre spécifique « clientèle fragile » ?',ty:'radio',o:[['oui','Oui'],['non','Non'],['nsp','Je ne sais pas']],if:x=>Array.isArray(x.fmot)&&x.fmot.includes('fragile'),sub:1},
   {k:'fdetails',l:'Précisions',ty:'area',h:'Facultatif : ce qui s’est passé (salaire versé en retard, erreur de la banque, frais répétés…).'}]},
  {t:'Justificatifs',photos:1,pre:()=>photosHTML(),recapRows:()=>[['Justificatifs',phCount()]],fields:[]},
  {t:'Vous',fields:SENDER()},
  {t:'Votre banque',fields:RECIP('de la banque et de l’agence','Exemple : « Banque du Sud — Agence Castellane ».')},
  letterSigStep(),
  {t:'Votre lettre',recap:1,fields:[]}
 ],
 recapSkip:['flignes','fdetails'],recapMore:i=>i===1&&fraisLines().length?[['Frais',fraisLines().join(' ; ')]]:[],
 recapBefore:()=>letterPreview(fraisObjet(),fraisParas()),
 missing(){const m=letterMissing();if(!fraisLines().length&&!isFinite(num(d.ftotal)))m.unshift('frais contestés ou montant');if(!(d.fmot||[]).length)m.unshift('motif de la contestation');return m},
 missWarn:'Vous pouvez quand même produire le PDF, mais complétez ces informations avant de l’envoyer.',
 mailHint:'messagerie ou mail de votre conseiller',
 recapAfter:()=>`<div class="note" style="margin-top:16px"><p><b>Pour l’envoyer :</b> déposez le PDF dans la messagerie sécurisée de votre banque <b>ou</b> envoyez-le en <b>lettre recommandée avec accusé de réception</b> à votre agence, et gardez la preuve : le délai de 2 mois avant le médiateur part de cette réclamation écrite.</p></div>`,
 fname:()=>`Reclamation_frais_bancaires${fnDest()}_${d.le||today}.pdf`,
 mail(){return {to:clean1(d.mailto),subj:fraisObjet(),body:`Madame, Monsieur,\n\nVeuillez trouver ci-joint ma réclamation concernant des frais prélevés sur mon compte, avec les justificatifs.\n\n${fullName()}`}},
 build(){return letterPDF({objet:fraisObjet(),paras:fraisParas(),pj:myPh().length?'Pièces jointes : relevés de compte.':'',ph:myPh(),annexTitle:'Pièces jointes'})}
};

/* ================= Document 24 : demande de délai de paiement / échéancier (débiteur → créancier) ================= */
const ECRE=[['impots','Impôts'],['fournisseur','Facture (énergie, téléphone, artisan…)'],['loyer','Loyer ou charges'],['hopital','Hôpital ou clinique'],['credit','Crédit'],['autre','Autre']];
const ECRE_TXT={impots:'mon imposition',fournisseur:'votre facture',loyer:'ma dette de loyer et de charges',hopital:'votre facture de frais d’hospitalisation',credit:'les échéances de mon crédit',autre:'la somme que je vous dois'};
const EMOTIF=[['emploi','Perte d’emploi ou baisse d’activité'],['sante','Maladie ou accident'],['separation','Séparation ou décès dans la famille'],['baisse','Baisse de revenus'],['imprevu','Dépense imprévue'],['autre','Autre']];
const EMOTIF_TXT={emploi:'de la perte de mon emploi ou d’une baisse de mon activité',sante:'d’une maladie ou d’un accident',separation:'d’une séparation ou d’un décès dans ma famille',baisse:'d’une baisse de mes revenus',imprevu:'d’une dépense imprévue',autre:'de difficultés financières passagères'};
function echCalc(){
 const tot=num(d.emontant),ap=num(d.eapport)>0?num(d.eapport):0,n=Math.max(0,parseInt(d.enb)||0);
 const reste=isFinite(tot)?Math.round((tot-ap)*100)/100:NaN;
 if(!(reste>0)||!n)return {tot,ap,n,reste,ok:false};
 const m=Math.floor(reste*100/n)/100,last=Math.round((reste-m*(n-1))*100)/100;
 const dates=d.edebut?Array.from({length:n},(_,i)=>addMonths(d.edebut,i)):[];
 return {tot,ap,n,reste,m,last,dates,ok:true,fin:dates[n-1]};
}
function echInfo(){
 const c=echCalc();
 if(!c.ok)return `<div class="note"><p>Indiquez le montant dû et le nombre de mensualités : l’appli calcule l’échéancier.</p></div>`;
 return `<div class="note"><p><b>Votre proposition : ${c.ap?`${eur(c.ap)} tout de suite, puis `:''}${c.n} mensualité${c.n>1?'s':''} de ${eur(c.m)}</b>${c.last!==c.m?` (la dernière de ${eur(c.last)})`:''}${c.dates.length?`, du ${esc(fr(c.dates[0]))} au ${esc(fr(c.fin))}`:''}.</p><p style="font-size:13px;color:var(--mute)">Proposez une mensualité que vous pourrez vraiment tenir : un échéancier non respecté est en général annulé.</p></div>`;
}
function echParas(){
 const c=echCalc(),L=[],ref=clean1(d.eref),obj=clean1(d.eobjet)||ECRE_TXT[d.ecre]||'la somme que je vous dois';
 L.push(`Ma demande concerne ${obj}${ref?` (référence ${ref})`:''}, d’un montant de ${isFinite(c.tot)?eur(c.tot):'…'}${d.eech?`, à régler avant le ${fr(d.eech)}`:''}.`);
 L.push(`Je ne suis pas en mesure de régler cette somme en une seule fois, en raison ${EMOTIF_TXT[d.emotif]||'de difficultés financières passagères'}${clean1(d.edetails)?` : ${clean1(d.edetails).replace(/[.]$/,'')}`:''}.${isFinite(num(d.eres))?` Mes ressources mensuelles s’élèvent à environ ${eur(num(d.eres))}${isFinite(num(d.echg))?` et mes charges fixes à environ ${eur(num(d.echg))}`:''}.`:''}`);
 if(c.ok)L.push(`Souhaitant m’acquitter de ma dette, je vous propose ${c.ap?`de verser ${eur(c.ap)} dès réception de votre accord, puis `:''}de régler ${c.ap?'le solde de ':''}${eur(c.reste)} en ${c.n} mensualité${c.n>1?'s':''} de ${eur(c.m)}${c.last!==c.m?` (la dernière de ${eur(c.last)})`:''}${c.dates.length?`, du ${fr(c.dates[0])} au ${fr(c.fin)}${c.n>1?', le même jour de chaque mois':''}`:''}.`);
 else L.push(`Souhaitant m’acquitter de ma dette, je vous demande de m’accorder un délai de paiement ou un échéancier adapté à ma situation.`);
 L.push(d.ecre==='impots'
  ?`Je vous remercie de bien vouloir m’accorder ce plan de règlement et d’examiner, le cas échéant, une remise gracieuse des pénalités liées à ce retard.`
  :`Je vous remercie de bien vouloir accepter cet échéancier et, pendant son exécution, de suspendre toute procédure de recouvrement ainsi que l’application de pénalités de retard.`);
 L.push(`Je reste à votre disposition pour vous fournir tout justificatif de ma situation et vous remercie de me confirmer votre accord par écrit.`);
 return L;
}
const echObjet=()=>`Demande de délai de paiement${clean1(d.eref)?' — référence '+clean1(d.eref):''}`;
const ECHEANCIER={
 key:'attest_echeancier_v1',title:'Demande de délai de paiement',sub:'Proposer un échéancier à un créancier',
 init:x=>{if(!x.le)x.le=today;if(!x.enb)x.enb='6'},
 maxPh:4,phLabels:[],phIntro:()=>`<p>Joignez si possible la <b>facture ou l’avis</b> concerné et des <b>justificatifs de votre situation</b> (bulletin de salaire, attestation de France Travail, arrêt maladie…). Les photos sont ajoutées à la fin du PDF (4 au maximum).</p>`,
 phBtn:n=>n?'Ajouter un justificatif':'Photographier la facture ou l’avis',
 steps:[
  {t:'Avant de commencer',pre:()=>`<div class="note"><p><b>À quoi sert cette lettre ?</b> À demander à un créancier (impôts, fournisseur d’énergie, bailleur, hôpital, organisme de crédit…) de payer une dette en plusieurs fois, en proposant un échéancier réaliste.</p></div>
 <div class="note warn"><ul>
  <li>Écrivez <b>avant</b> la date limite de paiement si possible, et continuez à payer ce que vous pouvez.</li>
  <li><b>Impôts :</b> la demande de délai se fait en ligne depuis votre <b>espace particulier sur impots.gouv.fr</b> (messagerie sécurisée). L’administration répond en principe dans les 2 mois ; sans réponse, la demande est considérée comme rejetée. En cas de refus, vous pouvez contacter le conciliateur fiscal départemental.</li>
  <li>Le créancier n’est pas obligé d’accepter. Le juge peut, lui, reporter ou échelonner une dette dans la limite de <b>2 ans</b> (article 1343-5 du code civil).</li>
  <li><b>Plusieurs dettes que vous ne pouvez plus payer ?</b> Le <b>dossier de surendettement</b> se dépose auprès de la <b>Banque de France</b> (gratuit, possible en ligne). Un Point conseil budget ou un CCAS peut vous aider.</li></ul></div>`,fields:[]},
  {t:'Votre dette',fields:[
   {k:'ecre',l:'À qui devez-vous cette somme ?',ty:'radio',o:ECRE},
   {k:'eobjet',l:'De quoi s’agit-il ?',ty:'text',h:'Facultatif. Exemple : « la facture d’électricité de septembre 2026 », « le solde de mon impôt sur le revenu 2025 ».'},
   {row:[{k:'eref',l:'N° de facture, d’avis ou de dossier',ty:'text'},{k:'emontant',l:'Montant dû (€)',ty:'text'}]},
   {k:'eech',l:'Date limite de paiement',ty:'date',h:'Facultatif.'}]},
  {t:'Votre proposition',fields:[
   {k:'eapport',l:'Premier versement tout de suite (€)',ty:'text',h:'Facultatif.'},
   {row:[{k:'enb',l:'Nombre de mensualités',ty:'tel'},{k:'edebut',l:'Date de la 1re mensualité',ty:'date'}]}],
   post:()=>`<div id="einfo">${echInfo()}</div>`,live:['eapport','enb','edebut'],liveFn:()=>{const c=$('#einfo');if(c)c.innerHTML=echInfo()}},
  {t:'Votre situation',fields:[
   {k:'emotif',l:'Pourquoi ne pouvez-vous pas payer en une fois ?',ty:'radio',o:EMOTIF},
   {k:'edetails',l:'Expliquez en quelques mots',ty:'area',h:'Facultatif. Exemple : « licencié en septembre, j’attends l’ouverture de mes droits ».'},
   {row:[{k:'eres',l:'Ressources par mois (€)',ty:'text',h:'Facultatif'},{k:'echg',l:'Charges fixes par mois (€)',ty:'text',h:'Facultatif'}]}]},
  {t:'Justificatifs',photos:1,pre:()=>photosHTML(),recapRows:()=>[['Justificatifs',phCount()]],fields:[]},
  {t:'Vous',fields:SENDER()},
  {t:'Le créancier',fields:RECIP('du créancier','Exemple : « Service des impôts des particuliers de Marseille », « EDF », « CHU de Bordeaux ».')},
  letterSigStep(),
  {t:'Votre lettre',recap:1,fields:[]}
 ],
 recapSkip:['edetails'],recapMore:()=>[],
 recapBefore:()=>echInfo()+letterPreview(echObjet(),echParas()),
 missing(){const m=letterMissing();if(!isFinite(num(d.emontant)))m.unshift('montant dû');if(!echCalc().ok)m.push('proposition de mensualités');return m},
 missWarn:'Vous pouvez quand même produire le PDF, mais complétez ces informations avant de l’envoyer.',
 mailHint:'mail ou messagerie du créancier',
 recapAfter:()=>`<div class="note" style="margin-top:16px"><p><b>Pour l’envoyer :</b> ${d.ecre==='impots'?'déposez le PDF dans la <b>messagerie sécurisée</b> de votre espace particulier sur impots.gouv.fr (rubrique paiement), ou envoyez-le au service indiqué sur votre avis.':'utilisez l’adresse ou la messagerie indiquée sur la facture, ou envoyez la lettre en <b>recommandé avec accusé de réception</b> pour garder une preuve.'} Conservez une copie.</p></div>`,
 fname:()=>`Demande_delai_paiement${fnDest()}_${d.le||today}.pdf`,
 mail(){return {to:clean1(d.mailto),subj:echObjet(),body:`Madame, Monsieur,\n\nVeuillez trouver ci-joint ma demande de délai de paiement, avec une proposition d’échéancier et mes justificatifs.\n\n${fullName()}`}},
 build(){return letterPDF({objet:echObjet(),paras:echParas(),rec:false,pj:myPh().length?'Pièces jointes : facture ou avis et justificatifs de ma situation.':'',ph:myPh(),annexTitle:'Pièces jointes'})}
};

/* ================= Document : autorisation de sortie du territoire (Cerfa 15646*01) ================= */
const AST_F='topmostSubform[0].Page1[0].';
const astAdd=(iso,days)=>{if(!iso)return '';const t=new Date(iso+'T12:00:00');t.setDate(t.getDate()+days);return t.toISOString().slice(0,10)};
const astMax=()=>{const s=d.le||today;const t=new Date(s+'T12:00:00');t.setFullYear(t.getFullYear()+1);t.setDate(t.getDate()-1);return t.toISOString().slice(0,10)};
const astEnfant=()=>[d.e_prenom,d.e_nom&&d.e_nom.toUpperCase()].filter(Boolean).map(clean1).join(' ');
function astInfo(){
 const max=astMax(),fin=d.fin;
 if(!fin)return `<div class="note"><p>L’autorisation peut aller jusqu’au <b>${fr(max)}</b> au plus tard (un an à compter de la signature, le ${fr(d.le||today)}). Mettez la date de retour prévue, avec un peu de marge.</p></div>`;
 if(fin>max)return `<div class="note warn"><p class="miss">Trop long : l’autorisation ne peut pas dépasser un an à compter de sa signature. Date la plus tardive possible : <b>${fr(max)}</b>.</p></div>`;
 if(fin<(d.le||today))return `<div class="note warn"><p class="miss">La date de fin est avant la date de signature.</p></div>`;
 if(d.retour&&fin<d.retour)return `<div class="note warn"><p class="miss">La date de fin (${fr(fin)}) est avant la date de retour prévue (${fr(d.retour)}) : l’enfant ne serait plus couvert au retour.</p></div>`;
 return `<div class="note"><p>✓ Autorisation valable jusqu’au <b>${fr(fin)}</b> inclus.</p></div>`;
}
const AST_VOIES=['Rue','Avenue','Boulevard','Allée','Place','Route','Impasse','Lieu-dit','Lotissement','Passage','Résidence','Rond-Point','Square','Village'];
function astSplitAdr(s){
 s=clean1(s);const m=s.match(/^(\d+)\s*(bis|ter|quater|[A-D])?\b[\s,]*(.*)$/i);let num='',ext='',rest=s;
 if(m){num=m[1];ext=m[2]||'';rest=m[3]}
 let voie='';const w=rest.split(' ')[0]||'';const v=AST_VOIES.find(x=>x.toLowerCase()===w.toLowerCase().replace(/\.$/,'')||(w.toLowerCase()==='bd'&&x==='Boulevard')||(w.toLowerCase()==='av'&&x==='Avenue'));
 if(v){voie=v;rest=rest.slice(w.length).trim()}
 return {num,ext,voie,rest};
}
const AST={
 key:'attest_ast_v1',title:'Autorisation de sortie du territoire',sub:'Cerfa 15646*01 — enfant qui voyage sans ses parents',
 init:x=>{if(!x.le)x.le=today;if(!x.e_pays)x.e_pays='France';if(!x.p_pays)x.p_pays='France';if(!x.p_nat)x.p_nat='Française';if(!x.p_padr)x.p_padr='France';if(!x.qualite)x.qualite='mere';if(!x.doctype)x.doctype='cni'},
 maxPh:2,phLabels:['Recto','Verso'],
 phIntro:()=>`<p>Photographiez <b>votre pièce d’identité</b> (recto et verso) : la copie est ajoutée à la fin du PDF. L’enfant devra présenter cette copie avec le formulaire.</p>`,
 phBtn:n=>n?'Ajouter le verso':'Photographier votre pièce d’identité',
 steps:[
  {t:'Avant de commencer',pre:()=>`<div class="note"><p><b>À quoi sert ce document ?</b> Un enfant mineur qui <b>quitte la France sans être accompagné d’un de ses parents</b> (voyage scolaire, colonie, séjour chez des proches, voyage avec un autre adulte…) doit avoir une <b>autorisation de sortie du territoire</b> signée par un parent (titulaire de l’autorité parentale). L’appli remplit pour vous le formulaire officiel <b>Cerfa n° 15646*01</b>.</p></div>
 <div class="note warn"><ul>
  <li>Aucune démarche en mairie ou en préfecture : il suffit de remplir et signer le formulaire.</li>
  <li>L’autorisation est valable <b>un an au plus</b> à compter de sa signature.</li>
  <li>L’enfant voyage avec <b>3 documents</b> : sa propre <b>pièce d’identité</b> (carte d’identité ou passeport, selon le pays), le <b>formulaire signé</b> et la <b>copie de la pièce d’identité du parent</b> qui a signé.</li>
  <li>Selon la destination, un <b>passeport</b> ou un <b>visa</b> peut être exigé : vérifiez sur la page « Conseils aux voyageurs » du ministère des Affaires étrangères.</li>
  <li>Cette autorisation ne lève pas une <b>opposition</b> ou une <b>interdiction de sortie du territoire</b> décidée pour l’enfant.</li></ul></div>`,fields:[]},
  {t:'L’enfant',fields:[
   {k:'e_nom',l:'Nom (figurant sur l’acte de naissance)',ty:'text'},
   {k:'e_prenom',l:'Prénom(s)',ty:'text'},
   {row:[{k:'e_naiss',l:'Date de naissance',ty:'date'},{k:'e_naisslieu',l:'Lieu de naissance',ty:'text'}]},
   {k:'e_pays',l:'Pays de naissance',ty:'text'}]},
  {t:'Vous, le parent qui signe',fields:[
   {k:'qualite',l:'Vous êtes',ty:'radio',o:[['mere','La mère'],['pere','Le père'],['autre','Une autre personne qui exerce l’autorité parentale']]},
   {k:'qualautre',l:'Précisez',ty:'text',if:x=>x.qualite==='autre',h:'Exemple : « tuteur légal ».'},
   {k:'p_nom',l:'Nom (figurant sur l’acte de naissance)',ty:'text'},
   {k:'p_usage',l:'Nom d’usage',ty:'text',h:'Facultatif. Exemple : nom d’épouse ou d’époux.'},
   {k:'p_prenom',l:'Prénom(s)',ty:'text'},
   {row:[{k:'p_naiss',l:'Date de naissance',ty:'date'},{k:'p_naisslieu',l:'Lieu de naissance',ty:'text'}]},
   {row:[{k:'p_pays',l:'Pays de naissance',ty:'text'},{k:'p_nat',l:'Nationalité',ty:'text'}]}]},
  {t:'Vos coordonnées',fields:[
   {k:'p_adr',l:'Adresse',ty:'text',h:'Exemple : « 12 bis rue de la République ».'},
   {row:[{k:'p_cp',l:'Code postal',ty:'tel'},{k:'p_ville',l:'Commune',ty:'text'}]},
   {k:'p_padr',l:'Pays',ty:'text'},
   {row:[{k:'p_tel',l:'Téléphone',ty:'tel',h:'Recommandé'},{k:'p_mail',l:'Mail',ty:'email',h:'Recommandé'}]}]},
  {t:'Le voyage',fields:[
   {k:'dest',l:'Destination',ty:'text',h:'Facultatif : elle ne figure pas sur le formulaire, mais sert à vérifier les papiers demandés.'},
   {row:[{k:'depart',l:'Départ prévu',ty:'date',h:'Facultatif'},{k:'retour',l:'Retour prévu',ty:'date',h:'Facultatif'}]},
   {k:'fin',l:'L’autorisation est valable jusqu’au (inclus)',ty:'date',h:'Un an au plus après la signature.'}],
   post:()=>`<div id="astinfo">${astInfo()}</div>`,live:['fin','retour','le'],liveFn:()=>{const c=$('#astinfo');if(c)c.innerHTML=astInfo()}},
  {t:'Votre pièce d’identité',pre:()=>`<div class="note"><p>Indiquez la pièce d’identité dont vous joignez la copie. Si vous êtes français, une carte d’identité ou un passeport <b>périmé depuis moins de 5 ans</b> est accepté.</p></div>`,fields:[
   {k:'doctype',l:'Type de document',ty:'radio',o:[['cni','Carte nationale d’identité'],['passeport','Passeport'],['autre','Autre']]},
   {k:'docautre',l:'Précisez',ty:'text',if:x=>x.doctype==='autre',h:'Exemple : « titre de séjour ».'},
   {row:[{k:'docdate',l:'Délivré(e) le',ty:'date'},{k:'docpar',l:'Par (autorité de délivrance)',ty:'text',h:'Exemple : « Préfecture des Bouches-du-Rhône ».'}]}]},
  {t:'Copie de votre pièce d’identité',photos:1,pre:()=>photosHTML(),recapRows:()=>[['Copie de la pièce d’identité',phCount()]],fields:[]},
  {t:'Date et signature',fields:[{k:'le',l:'Date de signature',ty:'date'}],post:()=>sigHTML('Signez avec le doigt'),pads:[['sigT','sig']],recapRows:()=>[['Signature',d.sigt?'Oui':'Non (à signer à la main après impression)']]},
  {t:'Récapitulatif et envoi',recap:1,fields:[]}
 ],
 recapSkip:[],recapMore:()=>[],
 recapBefore:()=>astInfo(),
 missing(){const m=[];if(!d.e_nom||!d.e_prenom)m.push('nom et prénom de l’enfant');if(!d.e_naiss)m.push('date de naissance de l’enfant');
  if(!d.p_nom||!d.p_prenom)m.push('vos nom et prénom');if(!d.p_adr||!d.p_ville)m.push('votre adresse');if(!d.fin)m.push('date de fin de l’autorisation');
  else if(d.fin>astMax())m.push('durée de plus d’un an');if(!d.docdate||!d.docpar)m.push('votre pièce d’identité');if(!myPh().length)m.push('copie de votre pièce d’identité');return m},
 missWarn:'Vous pouvez quand même produire le PDF, mais un formulaire incomplet risque d’être refusé à la frontière.',
 mailHint:'accompagnateur, organisateur du séjour…',
 recapAfter:()=>`<div class="note" style="margin-top:16px"><p><b>Le plus sûr :</b> imprimez le formulaire et ${d.sigt?'gardez-le tel quel ou ':''}<b>signez-le à la main</b>. L’enfant doit avoir sur lui <b>l’original</b> du formulaire signé, <b>la copie de votre pièce d’identité</b> (jointe à la fin du PDF) et <b>sa propre pièce d’identité</b> (carte d’identité ou passeport${clean1(d.dest)?', selon les règles du pays de destination : '+esc(clean1(d.dest)):''}).</p>
  <p style="font-size:13px;color:var(--mute);margin-top:8px">Le formulaire officiel peut aussi être rempli sur service-public.fr. Cette appli est indépendante de l’administration.</p></div>`,
 fname:()=>{const n=fnPart(d.e_nom);return `Autorisation_sortie_territoire${n?'_'+n:''}_${d.le||today}.pdf`},
 mail(){return {to:clean1(d.mailto),subj:`Autorisation de sortie du territoire — ${astEnfant()}`,
  body:`Bonjour,\n\nVeuillez trouver ci-joint l’autorisation de sortie du territoire (Cerfa 15646*01) de ${astEnfant()||'mon enfant'}${clean1(d.dest)?` pour son séjour à destination de ${clean1(d.dest)}`:''}, valable jusqu’au ${fr(d.fin)||'…'}, avec la copie de ma pièce d’identité.\n\nCordialement,\n${[d.p_prenom,d.p_nom&&d.p_nom.toUpperCase()].filter(Boolean).map(clean1).join(' ')}`}},
 async build(){
  const {PDFDocument,StandardFonts}=PDFLib;
  const r=await fetch('cerfa_15646.pdf');if(!r.ok)throw new Error('formulaire introuvable');
  const doc=await PDFDocument.load(await r.arrayBuffer());
  const font=await doc.embedFont(StandardFonts.Helvetica),bold=await doc.embedFont(StandardFonts.HelveticaBold);
  const enc=encoder(font),one=s=>enc(clean1(s));
  const form=doc.getForm();
  const set=(n,v,size=10)=>{try{const f=form.getTextField(AST_F+n+'[0]');let s=one(v);const ml=f.getMaxLength();if(ml)s=s.slice(0,ml);f.setText(s);f.setFontSize(size)}catch(e){}};
  const dt=v=>{if(!v)return '';const[y,m,dd]=v.split('-');return dd+m+y};
  set('txt_NomMineur',d.e_nom&&d.e_nom.toUpperCase());set('txt_PenomMineur',d.e_prenom);set('txt_DateNaissanceMineur',dt(d.e_naiss));
  set('txt_LieuNaissanceMineur',d.e_naisslieu);set('txt_PaysNaissanceMineur',d.e_pays);
  set('txt_NomParent',d.p_nom&&d.p_nom.toUpperCase());set('txt_NomUsageParent',d.p_usage&&d.p_usage.toUpperCase());set('txt_PenomParent',d.p_prenom);
  set('txt_DateNaissanceParent',dt(d.p_naiss));set('txt_LieuNaissanceParent',d.p_naisslieu);set('txt_PaysNaissanceParent',d.p_pays);set('txt_NationaliteParent',d.p_nat);
  try{const g=form.getRadioGroup(AST_F+'grp_rdb_Qualite[0]');g.select({pere:'3',mere:'2',autre:'1'}[d.qualite]||'2')}catch(e){}
  if(d.qualite==='autre')set('txt_AutreQualiteParent',d.qualautre);
  const a=astSplitAdr(d.p_adr);set('txt_NumAdresseParent',a.num);set('txt_ExtensionAdresseParent',a.ext);
  try{if(a.voie)form.getDropdown(AST_F+'list_TypeVoieAdresseParent[0]').select(a.voie)}catch(e){}
  set('txt_NomVoieAdresseParent',a.rest);set('txt_CodePostalAdresseParent',String(d.p_cp||'').replace(/\D/g,''));set('txt_CommuneAdresseParent',d.p_ville);set('txt_PaysAdresseParent',d.p_padr);
  set('txt_TelephoneParent',String(d.p_tel||'').replace(/\D/g,''));set('txt_CourrielParent',d.p_mail);
  set('txt_DateDureeAutorisation',dt(d.fin));set('txt_DateSignatureAutorisation',dt(d.le));
  try{form.getRadioGroup(AST_F+'grp_rdb_TypeDocument[0]').select({cni:'3',passeport:'2',autre:'1'}[d.doctype]||'3')}catch(e){}
  if(d.doctype==='autre')set('txt_AutreTypeDocument',d.docautre);
  set('txt_DateDelivranceDocument',dt(d.docdate));set('txt_AutoriteDelivranceDocument',d.docpar);
  for(const b of ['Imprimer1','Réinitialiser1']){try{form.removeField(form.getButton(AST_F+b+'[0]'))}catch(e){}}
  form.updateFieldAppearances(font);form.flatten();
  const pg=doc.getPages()[0];
  const s=sigImg('sig');if(s){const im=await doc.embedPng(s.u),k=Math.min(86/im.width,40/im.height);pg.drawImage(im,{x:447,y:258,width:im.width*k,height:im.height*k})}
  const photos=myPh();if(photos.length){
   const W=595.28,H=841.89,M=40,bw=W-2*M,bh=330;const p2=doc.addPage([W,H]);
   p2.drawText(enc('Copie du document justifiant l’identité du signataire'),{x:M,y:H-50,size:12,font:bold,color:INK()});
   p2.drawText(enc([d.p_prenom,d.p_nom&&d.p_nom.toUpperCase()].filter(Boolean).map(clean1).join(' ')),{x:M,y:H-65,size:9,font,color:INK()});
   for(let j=0;j<photos.length;j++){const p=photos[j],im=await doc.embedJpg(new Uint8Array(await p.blob.arrayBuffer()));
    const top=H-85-j*360,k=Math.min(bw/im.width,bh/im.height),w=im.width*k,h=im.height*k;
    p2.drawImage(im,{x:M+(bw-w)/2,y:top-bh+(bh-h)/2,width:w,height:h});p2.drawText(j?'Verso':'Recto',{x:M,y:top-bh-13,size:9,font,color:INK()})}
  }
  doc.setTitle('Autorisation de sortie du territoire (Cerfa 15646*01)');
  return finish(doc);
 }
};

const DOCS={temoin:TEMOIN,demeure:DEMEURE,dette:DETTE,heberg:HEBERG,animal:ANIMAL,retract:RETRACT,resil:RESIL,vol:VOL,preavis:PREAVIS,travaux:TRAVAUX,energie:ENERGIE,colis:COLIS,procu:PROCU,fps:FPS,fraude:FRAUDE,honneur:HONNEUR,recours:RECOURS,conformite:CONFORMITE,sepa:SEPA,insalubre:INSALUBRE,depot:DEPOT,demission:DEMISSION,frais:FRAIS,echeancier:ECHEANCIER,ast:AST};
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
   APK de test (debug, version « 1.1-test ») : pubs de TEST Google. AAB Google Play (release) : vraies pubs du compte AdMob vitfix.applis.
   Ne jamais cliquer sur ses propres vraies pubs (risque de suspension du compte AdMob).
   L'identifiant d'APPLICATION AdMob est posé par scripts/patch-android.mjs (ADMOB_APP_ID_TEST / ADMOB_APP_ID_PROD). */
/* ================= Mesure d'audience : Firebase Analytics, appli Android seulement, et seulement après consentement =================
   Le formulaire Google (UMP) enregistre le choix au format IAB TCF ; le module natif Tcf le lit.
   Mesure activée si : RGPD non applicable, ou finalités 1 et (8 ou 9) acceptées et fournisseur Google (755) accepté.
   Aucune donnée saisie n'est envoyée : seulement le type de document ouvert et la création d'un PDF. */
const Stats=(()=>{
 const P=NATIVE&&CAP.Plugins||{},F=P.FirebaseAnalytics,T=P.Tcf;let on=false;
 const bit=(s,n)=>!!s&&s.length>=n&&s[n-1]==='1';
 async function apply(){
  if(!F)return;let ok=false;
  try{if(T){const t=await T.get();ok=t.gdprApplies===0||(bit(t.purposeConsents,1)&&(bit(t.purposeConsents,8)||bit(t.purposeConsents,9))&&bit(t.vendorConsents,755))}}catch(e){ok=false}
  on=ok;
  try{await F.setConsent({type:'ANALYTICS_STORAGE',status:ok?'GRANTED':'DENIED'});await F.setEnabled({enabled:ok})}catch(e){}
  if(ok&&view&&view!=='home')screen(view);
 }
 const ev=(name,params)=>{if(on&&F)F.logEvent({name,params:params||{}}).catch(()=>{})};
 const screen=n=>{if(on&&F)F.setCurrentScreen({screenName:n}).catch(()=>{})};
 return {apply,ev,screen};
})();
const ADS={enabled:!window.ATTEST_NOADS,test:true,interstitialTest:'ca-app-pub-3940256099942544/1033173712',interstitialProd:window.ATTEST_ADS_PROD||'ca-app-pub-5405085918436600/9358177237',gapMs:3*60*1000,maxWaitMs:3000,safetyMs:45000};
const adUnit=()=>ADS.test?ADS.interstitialTest:ADS.interstitialProd;
const Ads=(()=>{
 const A=NATIVE&&ADS.enabled&&CAP.Plugins&&CAP.Plugins.AdMob;
 let ready=false,loaded=false,loading=null,last=0,privacy=false;
 const wait=ms=>new Promise(r=>setTimeout(r,ms));
 function load(){if(!ready||loaded)return Promise.resolve();if(!loading)loading=A.prepareInterstitial({adId:adUnit(),isTesting:ADS.test}).then(()=>{loaded=true}).catch(()=>{}).finally(()=>{loading=null});return loading}
 async function init(){
  if(!A)return;
  try{
   // vraies pubs seulement dans la version Google Play (versionName sans « -test ») ; en cas de doute : pubs de test
   try{const i=await CAP.Plugins.App.getInfo();ADS.test=!i||!i.version||/test/i.test(i.version)}catch(e){ADS.test=true}
   let c=await A.requestConsentInfo();                       // formulaire de consentement Google (RGPD) au besoin
   if(c.isConsentFormAvailable&&c.status==='REQUIRED')c=await A.showConsentForm();
   privacy=c.privacyOptionsRequirementStatus==='REQUIRED';
   Stats.apply();                                           // mesure d'audience : selon le choix de consentement
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
 const showPrivacy=()=>A?A.showPrivacyOptionsForm().catch(()=>{}).then(()=>Stats.apply()):Promise.resolve();
 return {init,gate,hasPrivacy:()=>privacy,showPrivacy};
})();

/* ================= Rappels d'agenda : « Ajouter à mon agenda » (pas de notification ni de permission) =================
   Android (appli) : ouvre l'agenda du téléphone avec l'événement prérempli (module natif CalendarIntent).
   Ailleurs (iPhone, ordinateur, version web) : fichier .ics avec deux alarmes (3 jours avant et la veille à 9 h). */
const Agenda=(()=>{
 const P=(NATIVE&&CAP.Plugins)||{},TODAY=new Date().toISOString().slice(0,10);
 const e=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 const frd=iso=>{const [y,m,dd]=iso.split('-');return `${dd}/${m}/${y}`};
 const next=iso=>{const t=new Date(iso+'T12:00:00Z');t.setUTCDate(t.getUTCDate()+1);return t.toISOString().slice(0,10)};
 const escI=s=>String(s||'').replace(/\\/g,'\\\\').replace(/;/g,'\\;').replace(/,/g,'\\,').replace(/\r?\n/g,'\\n');
 const fold=l=>{const out=[];let s=l;while(s.length>60){out.push(s.slice(0,60));s=' '+s.slice(60)}out.push(s);return out.join('\r\n')};
 function ics(r){
  const stamp=new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d+/,''),uid=Date.now()+'-'+Math.random().toString(36).slice(2)+'@vitfix.fr';
  const al=(trg)=>['BEGIN:VALARM','ACTION:DISPLAY','DESCRIPTION:'+escI(r.t),'TRIGGER:'+trg,'END:VALARM'];
  return ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Vitfix//Rappels//FR','CALSCALE:GREGORIAN','METHOD:PUBLISH','BEGIN:VEVENT','UID:'+uid,'DTSTAMP:'+stamp,
   'DTSTART;VALUE=DATE:'+r.date.replace(/-/g,''),'DTEND;VALUE=DATE:'+next(r.date).replace(/-/g,''),'SUMMARY:'+escI(r.t),'DESCRIPTION:'+escI(r.desc),'TRANSP:TRANSPARENT',
   ...al('-P2DT15H'),...al('-PT15H'),'END:VEVENT','END:VCALENDAR'].map(fold).join('\r\n')+'\r\n';
 }
 const ok=list=>(list||[]).filter(r=>r&&r.date&&/^\d{4}-\d\d-\d\d$/.test(r.date)&&r.date>=TODAY);
 function html(list){
  const L=ok(list);if(!L.length)return '';
  return `<div class="note agenda" style="margin-top:16px"><p><b>📅 Ne laissez pas passer la date</b></p><p>Ajoutez ${L.length>1?'ces dates':'cette date'} à l’agenda de votre téléphone pour être prévenu à temps.</p>
${L.map((r,i)=>`<button type="button" class="btn" data-agenda="${i}" style="width:100%;margin-top:8px;min-height:48px;height:auto;padding:8px 12px;text-align:center">${e(r.t)}<br><span style="font-weight:500;font-size:14px">${frd(r.date)} — ajouter à mon agenda</span></button>`).join('')}
<p class="agmsg" style="font-size:13px;margin-top:8px"></p></div>`;
 }
 async function add(r,msg){
  const say=t=>{if(msg)msg.innerHTML=t};
  if(P.CalendarIntent){try{await P.CalendarIntent.insert({title:r.t,description:r.desc||'',date:r.date});say('L’agenda s’est ouvert : vérifiez puis enregistrez l’événement.');return}catch(x){}}
  const txt=ics(r),name='rappel-'+r.date+'.ics';
  if(P.Filesystem&&P.Share){try{const w=await P.Filesystem.writeFile({path:name,data:txt,directory:'CACHE',encoding:'utf8'});await P.Share.share({title:r.t,files:[w.uri],dialogTitle:'Ajouter à l’agenda'});say('Choisissez votre application d’agenda.');return}catch(x){}}
  const url=URL.createObjectURL(new Blob([txt],{type:'text/calendar;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();
  say('Fichier « '+e(name)+' » téléchargé : ouvrez-le pour ajouter l’événement à votre agenda (rappels 3 jours avant et la veille).');
 }
 function bind(list,root){const L=ok(list);(root||document).querySelectorAll('[data-agenda]').forEach(b=>{const r=L[+b.dataset.agenda];const m=b.parentElement.querySelector('.agmsg');b.onclick=()=>{add(r,m);try{Stats.ev('rappel_agenda',{})}catch(x){}}})}
 return {html,bind,ics};
})();
/* Dates à rappeler pour le document ouvert (calculs déjà faits par chaque document) */
const addD=(iso,n)=>{const t=isoD(iso);return t?isoS(new Date(t.getTime()+n*864e5)):null};
function reminders(){
 const id=view,L=[],sent=d.le||today,R=(t,date,desc)=>{if(date)L.push({t,date,desc})};
 try{
 if(id==='demeure'){const n=+(d.delai||15);R('Mise en demeure : fin du délai laissé',addD(sent,n+3),`Fin du délai de ${n} jours laissé à ${clean1(d.dnom)||'votre destinataire'} (environ 3 jours d’acheminement compris). Sans réponse : relancez, puis conciliateur de justice ou tribunal.`)}
 if(id==='travaux'){const n=+(d.delai||15);R('Demande de travaux : fin du délai',addD(sent,n+3),`Fin du délai laissé au propriétaire (${n} jours, acheminement compris). Sans réponse : relancez, puis ADIL ou commission départementale de conciliation.`)}
 if(id==='retract'){const i=retractInfo();if(i.fin&&!i.late)R('Dernier jour pour se rétracter',i.fin,'La lettre de rétractation doit être envoyée au plus tard ce jour-là.')}
 if(id==='preavis'&&d.recep)R('Fin du préavis : remise des clés',preavisCalc().fin,'Fin du préavis de départ du logement : prévoyez l’état des lieux de sortie et la remise des clés.');
 if(id==='depot'&&d.cles)R('Dépôt de garantie : date limite de restitution',depotCalc().lim,'Le bailleur doit avoir rendu le dépôt de garantie. Sinon : relance, puis conciliateur de justice ou commission départementale de conciliation.');
 if(id==='demission')R('Fin du préavis de démission (indicative)',demCalc().fin,'Date indicative de fin du préavis : à confirmer avec votre employeur.');
 if(id==='fps')R('Dernier jour pour contester le FPS',fpsFin(),'Le recours administratif préalable (RAPO) doit être envoyé à la commune ou à la société indiquée sur l’avis de paiement.');
 if(id==='recours')R('Date limite du recours',recoursFin(),'Le recours amiable doit être envoyé avant cette date.');
 if(id==='energie')R('Sans réponse : saisir le médiateur',addMonths(sent,2),'Deux mois après la réclamation, sans réponse satisfaisante, vous pouvez saisir gratuitement le médiateur (énergie ou eau).');
 if(id==='ast'&&d.fin)R('Fin de l’autorisation de sortie du territoire',d.fin,`L’autorisation de sortie du territoire${clean1(d.e_prenom)?' de '+clean1(d.e_prenom):''} n’est plus valable après cette date.`);
 }catch(x){}
 return L;
}

/* ================= Moteur d'écrans ================= */
let view='home',doc=null,d={},cur=0;
function open(id){
 view=id;doc=DOCS[id];Stats.screen(id);Stats.ev('ouvrir_document',{document:id});
 try{d=JSON.parse(localStorage.getItem(doc.key)||'{}')}catch(e){d={}}
 doc.init(d);cur=Math.min(+(d._step||0),doc.steps.length-1);
}
const save=()=>{if(doc)try{localStorage.setItem(doc.key,JSON.stringify(d))}catch(e){}};
const ONLY=window.ATTEST_ONLY&&DOCS[window.ATTEST_ONLY]?window.ATTEST_ONLY:null;
{const v=ONLY||new URLSearchParams(location.search).get('doc')||localStorage.getItem('attest_view');if(DOCS[v])open(v)}

const sigHTML=hint=>`<div class="f"><span class="lab">Votre signature</span><canvas class="sig" id="sigT"></canvas><div class="sigbar"><span>${hint}</span><button type="button" class="link" data-clear="sig">Effacer</button></div></div>`;
function fieldHTML(f){
 if(f.row){if(f.if&&!f.if(d))return '';return `<div class="row">${f.row.map(fieldHTML).join('')}</div>`}
 if(f.if&&!f.if(d))return '';
 const id='f_'+f.k,v=d[f.k];let inner='';
 if(f.ty==='area')inner=`<textarea id="${id}" data-k="${f.k}"${f.big?' class="big"':''}>${esc(v)}</textarea>`;
 else if(f.ty==='check')inner=`<div class="opts" role="group">${f.o.map(([val,lab])=>`<label class="opt"><input type="checkbox" name="${f.k}" value="${val}" data-k="${f.k}" data-ty="check" ${Array.isArray(v)&&v.includes(val)?'checked':''}><span>${lab}</span></label>`).join('')}</div>`;
 else if(f.ty==='radio')inner=`<div class="opts" role="group">${f.o.map(([val,lab])=>`<label class="opt"><input type="radio" name="${f.k}" value="${val}" data-k="${f.k}" data-ty="radio" ${v===val?'checked':''}><span>${lab}</span></label>`).join('')}</div>`;
 else inner=`<input id="${id}" data-k="${f.k}" type="${f.ty}" value="${esc(v)}"${f.ty==='tel'?' inputmode="numeric"':''}${f.ty==='email'?' inputmode="email"':''}${f.ac?` autocomplete="${f.ac}"`:''}>`;
 const lab=(f.ty==='radio'||f.ty==='check')?`<span class="lab">${f.l}</span>`:`<label for="${id}">${f.l}</label>`;
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
 $('#prev').textContent=cur===0?(ONLY?'Précédent':'Documents'):'Précédent';if(ONLY){$('#prev').disabled=cur===0;$('#home').hidden=true}
 $('#next').textContent=cur===S.length-1?(ONLY?'Nouveau signalement':'Nouveau document'):cur===S.length-2?'Voir le récapitulatif':cur===0?'Commencer':'Suivant';
 (s.pads||[]).forEach(([id,k])=>setupPad(id,k));
 if(s.recap)bindRecap();
 window.scrollTo({top:0});
}
function keepScroll(){const y=window.scrollY;render();window.scrollTo({top:y})}

function recapHTML(){
 const S=doc.steps;
 const FLAT=S.flatMap((s,i)=>s.fields.flatMap(f=>(f.row||[f]).map(x=>({...x,if:x.if||f.if}))).map(f=>({...f,step:i})));
 const show=f=>{const v=d[f.k];if(v==null||v===''||(Array.isArray(v)&&!v.length))return null;if(f.o)return [].concat(v).map(x=>(f.o.find(o=>o[0]===x)||[,x])[1]).join(', ');if(f.ty==='date')return fr(v);return v};
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
 </div>${Agenda.html(reminders())}${FLAT.some(f=>f.k==='dnom')?lrarBlock():''}${doc.recapAfter?doc.recapAfter():''}<div id="out"></div>`;
}

document.addEventListener('input',e=>{const k=e.target.dataset.k;if(!k||!doc)return;
 if(e.target.dataset.ty==='check'){const a=new Set(Array.isArray(d[k])?d[k]:[]);e.target.checked?a.add(e.target.value):a.delete(e.target.value);d[k]=[...a]}else d[k]=e.target.value;save();
 const s=doc.steps[cur];if(s.live&&s.live.includes(k))s.liveFn();
 if(e.target.dataset.ty){const y=window.scrollY,nm=e.target.name,val=e.target.value;render();window.scrollTo({top:y});const el=document.querySelector(`input[name="${nm}"][value="${val}"]`);el&&el.focus({preventScroll:true})}
});
document.addEventListener('click',e=>{
 const o=e.target.closest('[data-open]');if(o){open(o.dataset.open);render();return}
 const g=e.target.closest('[data-go]');if(g){cur=+g.dataset.go;render();return}
 const c=e.target.closest('[data-clear]');if(c){const k=c.dataset.clear;delete d[k];delete d[k+'t'];save();keepScroll();return}
 const dp=e.target.closest('[data-delph]');if(dp){const id=dp.dataset.delph;photos=photos.filter(x=>x.id!==id);if(purls.has(id)){URL.revokeObjectURL(purls.get(id));purls.delete(id)}IDB.del(id).catch(()=>{});keepScroll()}
});
const goHome=()=>{if(ONLY)return;view='home';doc=null;render()};
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
 Agenda.bind(reminders());
 const out=$('#out'),say=(t,err)=>out.innerHTML=`<div class="msg${err?' err':''}">${t}</div>`;
 const busy=async(b,model,fn)=>{const lab=b.textContent;b.disabled=true;b.textContent='Un instant…';try{await Ads.gate()}catch(e){}b.textContent='Génération…';try{await fn(await doc.build(model));Stats.ev('document_pdf',{document:view})}catch(e){if(cancelled(e))say('Envoi annulé.');else say('Impossible de terminer : '+esc(e&&e.message||e),1)}b.disabled=false;b.textContent=lab};
 $('#dl').onclick=e=>busy(e.currentTarget,false,async b=>say(await saveBytes(b,false)));
 const mb=$('#model');if(mb)mb.onclick=e=>busy(e.currentTarget,true,async b=>say(await saveBytes(b,true)+' Imprimez aussi le Cerfa vierge (service-public.fr) et recopiez-y le texte à la main.'));
 $('#mail').onclick=e=>busy(e.currentTarget,false,async b=>say(await sendMail(b,doc.mail(),'Envoyer le document')));
 const ld=$('#lrar-dl');if(ld)ld.onclick=e=>busy(e.currentTarget,false,async b=>say(await saveBytes(b,false)+' Ouvrez ensuite La Poste ou Merci Facteur et joignez ce PDF.'));
 const lc=$('#lrar-copy');if(lc)lc.onclick=async()=>{const t=lrarAddr();let ok=false;try{await navigator.clipboard.writeText(t);ok=true}catch(e){try{const r=document.createRange();r.selectNodeContents($('#lrar-addr'));const sel=getSelection();sel.removeAllRanges();sel.addRange(r);ok=document.execCommand('copy')}catch(x){}}lc.textContent=ok?'✓ Adresse copiée':'Sélectionnez l’adresse et copiez-la';setTimeout(()=>lc.textContent='Copier l’adresse du destinataire',2500)};
}

render();
Ads.init();
IDB.all().then(a=>{photos=(a||[]).sort((x,y)=>x.t-y.t);if(doc&&doc.maxPh){const s=doc.steps[cur];if(s.recap||s.photos)render()}}).catch(()=>{});
window.addEventListener('resize',()=>{if(doc)(doc.steps[cur].pads||[]).forEach(([id,k])=>setupPad(id,k))});
if(NATIVE&&CAP.Plugins.App)CAP.Plugins.App.addListener('backButton',()=>{if(view==='home')CAP.Plugins.App.exitApp();else if(cur>0){cur--;render()}else goHome()});
if(NATIVE&&CAP.Plugins.SplashScreen)CAP.Plugins.SplashScreen.hide();
window.__attest={build:(id,model)=>{open(id);return DOCS[id].build(model)},letter:()=>letter()};
}
