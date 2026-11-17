import*as t from"three";import{GLTFLoader as qt}from"three/addons/loaders/GLTFLoader.js";import{MeshoptDecoder as Kt}from"three/addons/libs/meshopt_decoder.module.js";const le=matchMedia("(prefers-reduced-motion: reduce)").matches,Xt="model/choochie.glb?v=3",Gt=6837964,ut={happy:{face:"face_happy",gest:["happy","nod","excited"],idle:"idle_happy"},laugh:{face:"face_laugh",gest:["laugh"]},sweet:{face:"face_sweet",gest:["nod","shy"],blush:.45},shy:{face:"face_shy",gest:["shy"],blush:.8},bratty:{face:"face_bratty",gest:["smug","sarcastic","shrug"]},smug:{face:"face_smug",gest:["smug","sarcastic"]},pouty:{face:"face_pouty",gest:["pout","no"],mouthOwned:!0},sad:{face:"face_sad",gest:["pout"],idle:"idle_sad"},jealous:{face:"face_jealous",gest:["angry","no"]},surprised:{face:"face_surprised",gest:["excited"]},flirty:{face:"face_flirty",gest:["kiss","secret"],blush:.6},thinking:{face:"face_smug",gest:["thinking"],faceAmt:.4}},je={wave:["wave"],nod:["nod"],no:["no"],shrug:["shrug"],laugh:["laugh"],think:["thinking"],kiss:["kiss"],pout:["pout"],shy:["shy"],excited:["excited","wave2"],angry:["angry"],smug:["smug"],secret:["secret"],dance:["dance1","dance2","dance3","dance4","dance5"],spin:["spin"],jump:["jump"],bow:["bow"],thumbsup:["thumbsup"],cheer:["cheer"],yawn:["yawn"],stretch:["stretch"],point:["point"],stomp:["stomp"],cry:["cry"],heart:["heart"],peace:["peace"],showoff:["showoff"],flex:["flex"]},Yt={wave:4,dance1:5,dance2:2,jump:2},_t=/^(dance|spin|jump|bow|stretch|showoff|cry|excited)/,Vt={dance:"happy",spin:"happy",jump:"happy",cheer:"happy",heart:"flirty",peace:"happy",cry:"sad",yawn:"thinking",stomp:"pouty",flex:"smug",showoff:"smug"},Jt=new Set(["face_laugh","face_happy"]),Zt=new t.Vector3(.2802,.5735,.7697).normalize(),$t=new t.Vector3(.675,.635,.645),qe={uL:{value:new t.Vector3},uUp:{value:new t.Vector3},uLightCol:{value:$t.clone()},uFaceFwd:{value:new t.Vector3(0,0,1)}},Pt=`
uniform vec3 uL; uniform vec3 uUp; uniform vec3 uLightCol; uniform vec3 uFaceFwd;
uniform vec4 uSh; uniform vec4 uSh2; uniform vec4 uShCol; uniform vec4 uSh2Col; uniform vec3 uShBorderCol; uniform vec4 uFlat; uniform vec2 uLim;
#ifdef HAS_SHMASK
uniform sampler2D uShMask;
#endif
#ifdef HAS_SHBMASK
uniform sampler2D uShBMask; uniform vec4 uAO; uniform float uPostAO;
#endif
#ifdef LIL_BACKLIGHT
uniform vec4 uBl; uniform vec4 uBlCol; uniform vec2 uBl2;
#ifdef HAS_BLTEX
uniform sampler2D uBlTex;
#endif
#endif
#ifdef LIL_REFL
uniform vec4 uRefl; uniform vec4 uReflCol; uniform vec2 uRefl2;
#endif
#ifdef LIL_MATCAP
uniform vec4 uMc; uniform vec4 uMcCol; uniform vec4 uMcST; uniform vec2 uMc2; uniform sampler2D uMcTex;
#ifdef HAS_MCMASK
uniform sampler2D uMcMask;
#endif
#endif
#ifdef LIL_MATCAP2
uniform vec4 uMd; uniform vec4 uMdCol; uniform vec2 uMd2; uniform sampler2D uMdTex;
#ifdef HAS_MDMASK
uniform sampler2D uMdMask;
#endif
#endif
#ifdef LIL_RIM
uniform vec4 uRim; uniform vec4 uRim2; uniform vec4 uRimCol;
#ifdef HAS_RIMTEX
uniform sampler2D uRimTex;
#endif
#endif
#ifdef LIL_EMI
uniform vec4 uEm; uniform vec4 uEmCol;
#ifdef HAS_EMTEX
uniform sampler2D uEmTex;
#endif
#ifdef HAS_EMMASK
uniform sampler2D uEmMask;
#endif
#endif
#ifdef LIL_EMI2
uniform vec4 uEn; uniform vec4 uEnCol;
#ifdef HAS_ENTEX
uniform sampler2D uEnTex;
#endif
#endif
float lilToon(float v, float b, float bl) { float mn = clamp(b - bl * 0.5, 0.0, 1.0), mx = clamp(b + bl * 0.5, 0.0, 1.0); return clamp((v - mn) / clamp(mx - mn + fwidth(v), 0.0001, 1.0), 0.0, 1.0); }
float lilToonR(float v, float b, float bl, float r) { float mn = clamp(b - bl * 0.5 - r, 0.0, 1.0), mx = clamp(b + bl * 0.5, 0.0, 1.0); return clamp((v - mn) / clamp(mx - mn + fwidth(v), 0.0001, 1.0), 0.0, 1.0); }
vec3 lilBlendOut(vec3 d, vec3 s, float m) { return m < 0.5 ? s : m < 1.5 ? d + s : m < 2.5 ? max(d + s - d * s, d) : d * s; }
vec2 lilMcUV(vec3 n, vec3 V, vec4 st) {
  vec3 b = normalize(uUp - V * dot(uUp, V)); vec3 t = cross(b, V);
  vec2 uv = vec2(dot(t, n), dot(b, n)) * st.xy + st.zw;
  uv = uv * 0.5 + 0.5; return vec2(uv.x, 1.0 - uv.y);
}
`,en=`
vec3 albedo = diffuseColor.rgb;
vec3 N = normal; vec3 oN = nonPerturbedNormal;
vec3 V = isOrthographic ? vec3(0.0, 0.0, 1.0) : normalize(vViewPosition);
vec3 L = normalize(uL);
vec3 lc = clamp(uLightCol, vec3(uLim.x), vec3(uLim.y));
vec3 col = albedo * lc; float shadowmix = 1.0;
if (uSh.x > 0.5) {
  float l1 = clamp(dot(L, N) * 0.5 + 0.5, 0.0, 1.0);
  vec4 smask = vec4(1.0);
  #ifdef HAS_SHMASK
  smask = texture2D(uShMask, vMapUv);
  #endif
  float l2 = l1;
  #ifdef HAS_SHBMASK
  vec4 bm = texture2D(uShBMask, vMapUv); bm.r = clamp(bm.r * uAO.x + uAO.y, 0.0, 1.0); bm.g = clamp(bm.g * uAO.z + uAO.w, 0.0, 1.0);
  if (uPostAO < 0.5) { l1 *= bm.r; l2 *= bm.g; }
  #endif
  float x = lilToon(l1, uSh.y, uSh.z), y = lilToon(l2, uSh2.x, uSh2.y), w = lilToonR(l1, uSh.y, uSh.z, uSh2.w);
  #ifdef HAS_SHBMASK
  if (uPostAO > 0.5) { x *= bm.r; y *= bm.g; w *= bm.r; }
  #endif
  float bf = gl_FrontFacing ? 1.0 : 1.0 - uFlat.z; x *= bf; y *= bf; w *= bf;
  shadowmix = x;
  float str = uSh.w;
  if (uFlat.w > 0.5 && uFlat.w < 1.5) {
    vec3 fN = normalize((viewMatrix * vec4(uFaceFwd, 0.0)).xyz);
    float lf = clamp((dot(fN, L) + uFlat.x) / max(uFlat.y, 0.0001), 0.0, 1.0);
    x = mix(lf, x, smask.r); y = mix(lf, y, smask.r); w = mix(lf, w, smask.r);
  } else str *= smask.r;
  x = mix(1.0, x, str);
  vec3 ind = albedo * uShCol.rgb;
  ind = mix(ind, albedo * uSh2Col.rgb, uSh2Col.a - y * uSh2Col.a);
  ind = mix(ind, ind * albedo, uSh2.z);
  vec3 dir = albedo * lc; ind *= lc; ind = min(ind, dir);
  ind = mix(ind, dir, w * uShBorderCol);
  col = mix(ind, dir, x);
}
#ifdef LIL_BACKLIGHT
{
  vec4 bc = uBlCol;
  #ifdef HAS_BLTEX
  bc *= texture2D(uBlTex, vMapUv);
  #endif
  float fac = pow(clamp(-dot(V, L) * 0.5 + 0.5, 0.0, 1.0), uBl.z);
  float bln = lilToon(dot(normalize(-V * uBl.w + L), N) * 0.5 + 0.5, uBl.x, uBl.y);
  float b = clamp(fac * bln, 0.0, 1.0);
  if (!gl_FrontFacing && uBl2.y > 0.5) b = 0.0;
  bc.rgb = mix(bc.rgb, bc.rgb * albedo, uBl2.x);
  col += b * bc.a * bc.rgb * lc;
}
#endif
#ifdef LIL_REFL
{
  float pr = 1.0 - uRefl.x, rough = max(pr * pr, 0.002);
  vec3 H = normalize(V + L); float nh = clamp(dot(N, H), 0.0, 1.0), spec;
  if (uRefl.z > 0.5) spec = lilToon(pow(nh, 1.0 / rough), uRefl.w, uRefl2.x);
  else { float a2 = rough * rough, dd = nh * nh * (a2 - 1.0) + 1.0; spec = clamp(a2 / (3.14159 * dd * dd) * uRefl.y * clamp(dot(N, L), 0.0, 1.0), 0.0, 1.0); }
  col = mix(col, lilBlendOut(col, uReflCol.rgb * lc, uRefl2.y), spec * uReflCol.a);
}
#endif
#ifdef LIL_MATCAP
{
  vec3 n = normalize(mix(oN, N, uMc2.x));
  vec4 mc = uMcCol * textureLod(uMcTex, lilMcUV(n, V, uMcST), 0.0);
  mc.rgb = mix(mc.rgb, mc.rgb * lc, uMc.z); mc.a = mix(mc.a, mc.a * shadowmix, uMc2.y);
  vec3 mask = vec3(1.0);
  #ifdef HAS_MCMASK
  mask = texture2D(uMcMask, vMapUv).rgb;
  #endif
  mc.rgb = mix(mc.rgb, mc.rgb * albedo, uMc.w);
  col = mix(col, lilBlendOut(col, mc.rgb, uMc.y), uMc.x * mc.a * mask);
}
#endif
#ifdef LIL_MATCAP2
{
  vec3 n = normalize(mix(oN, N, uMd2.x));
  vec4 mc = uMdCol * textureLod(uMdTex, lilMcUV(n, V, vec4(1.0, 1.0, 0.0, 0.0)), 0.0);
  mc.rgb = mix(mc.rgb, mc.rgb * lc, uMd.z); mc.a = mix(mc.a, mc.a * shadowmix, uMd2.y);
  vec3 mask = vec3(1.0);
  #ifdef HAS_MDMASK
  mask = texture2D(uMdMask, vMapUv).rgb;
  #endif
  mc.rgb = mix(mc.rgb, mc.rgb * albedo, uMd.w);
  col = mix(col, lilBlendOut(col, mc.rgb, uMd.y), uMd.x * mc.a * mask);
}
#endif
#ifdef LIL_RIM
{
  vec4 rc = uRimCol;
  #ifdef HAS_RIMTEX
  rc *= texture2D(uRimTex, vMapUv);
  #endif
  rc.rgb = mix(rc.rgb, rc.rgb * albedo, uRim2.y);
  vec3 n = normalize(mix(oN, N, uRim2.w));
  float r = lilToon(pow(clamp(1.0 - abs(dot(n, V)), 0.0, 1.0), uRim.z), uRim.x, uRim.y);
  r = mix(r, r * shadowmix, uRim2.x);
  rc.rgb = mix(rc.rgb, rc.rgb * lc, uRim.w);
  col = mix(col, lilBlendOut(col, rc.rgb, uRim2.z), r * rc.a);
}
#endif
#ifdef LIL_EMI
{
  vec4 ec = uEmCol;
  #ifdef HAS_EMTEX
  ec *= texture2D(uEmTex, vMapUv);
  #endif
  #ifdef HAS_EMMASK
  ec *= texture2D(uEmMask, vMapUv);
  #endif
  ec.rgb = mix(ec.rgb, ec.rgb * albedo, uEm.z);
  col = mix(col, lilBlendOut(col, ec.rgb, uEm.y), uEm.x * ec.a);
}
#endif
#ifdef LIL_EMI2
{
  vec4 ec = uEnCol;
  #ifdef HAS_ENTEX
  ec *= texture2D(uEnTex, vMapUv);
  #endif
  ec.rgb = mix(ec.rgb, ec.rgb * albedo, uEn.z);
  col = mix(col, lilBlendOut(col, ec.rgb, uEn.y), uEn.x * ec.a);
}
#endif
`,dt=(s,o)=>(s=Array.isArray(s)&&s.length>=3?s:o,new t.Color().setRGB(s[0],s[1],s[2],t.SRGBColorSpace)),ce=(s,o)=>{const f=dt(s,o);return s=Array.isArray(s)&&s.length>=3?s:o,new t.Vector4(f.r,f.g,f.b,s.length>3?s[3]:1)},l=(s,o)=>typeof s=="number"?s:o;let Ke=null;function Rt(){return Ke||(Ke=new t.DataTexture(new Uint8Array([255,255,255,255]),1,1),Ke.needsUpdate=!0),Ke}function tn(s,o,f,X){const b=new t.MeshToonMaterial({map:s.map||Rt(),color:s.color,transparent:s.transparent,opacity:s.opacity,alphaTest:s.alphaTest,side:s.side,depthWrite:s.depthWrite});s.map&&(s.map.anisotropy=X,s.map.needsUpdate=!0),s.alphaTest>0&&!s.transparent&&(b.alphaToCoverage=!0);const p=l(o.Cull,2);b.side=p===0?t.DoubleSide:p===1?t.BackSide:t.FrontSide,s.transparent&&(b.depthWrite=l(o.ZWrite,0)>.5);const h={},u={};if(l(o.UseBumpMap,0)>.5&&f.BumpMap){b.normalMap=f.BumpMap;const w=l(o.BumpScale,1);b.normalScale=new t.Vector2(w,-w)}u.uSh={value:new t.Vector4(l(o.UseShadow,1),l(o.ShadowBorder,.5),l(o.ShadowBlur,.1),l(o.ShadowStrength,1))},u.uSh2={value:new t.Vector4(l(o.Shadow2ndBorder,.5),l(o.Shadow2ndBlur,.3),l(o.ShadowMainStrength,0),l(o.ShadowBorderRange,0))},u.uShCol={value:ce(o.ShadowColor,[.82,.76,.85,1])},u.uSh2Col={value:ce(o.Shadow2ndColor,[0,0,0,0])};const $=dt(o.ShadowBorderColor,[1,.1,0]);if(u.uShBorderCol={value:new t.Vector3($.r,$.g,$.b)},u.uFlat={value:new t.Vector4(l(o.ShadowFlatBorder,1),l(o.ShadowFlatBlur,1),l(o.BackfaceForceShadow,0),l(o.ShadowMaskType,0))},u.uLim={value:new t.Vector2(l(o.LightMinLimit,.05),l(o.LightMaxLimit,1))},f.ShadowStrengthMask&&(h.HAS_SHMASK="",u.uShMask={value:f.ShadowStrengthMask}),f.ShadowBorderMask){h.HAS_SHBMASK="",u.uShBMask={value:f.ShadowBorderMask};const w=o.ShadowAOShift||[1,0,1,0];u.uAO={value:new t.Vector4(w[0],w[1],w[2],w[3])},u.uPostAO={value:l(o.ShadowPostAO,0)}}if(l(o.UseBacklight,0)>.5&&(h.LIL_BACKLIGHT="",u.uBl={value:new t.Vector4(l(o.BacklightBorder,.35),l(o.BacklightBlur,.05),l(o.BacklightDirectivity,5),l(o.BacklightViewStrength,1))},u.uBlCol={value:ce(o.BacklightColor,[.85,.8,.7,1])},u.uBl2={value:new t.Vector2(l(o.BacklightMainStrength,0),l(o.BacklightBackfaceMask,1))},f.BacklightColorTex&&(h.HAS_BLTEX="",u.uBlTex={value:f.BacklightColorTex})),l(o.UseReflection,0)>.5&&l(o.ApplySpecular,1)>.5&&(h.LIL_REFL="",u.uRefl={value:new t.Vector4(l(o.Smoothness,1),l(o.Reflectance,.04),l(o.SpecularToon,1),l(o.SpecularBorder,.5))},u.uRefl2={value:new t.Vector2(l(o.SpecularBlur,0),l(o.ReflectionBlendMode,1))},u.uReflCol={value:ce(o.ReflectionColor,[1,1,1,1])}),l(o.UseMatCap,0)>.5&&f.MatCapTex){h.LIL_MATCAP="",u.uMc={value:new t.Vector4(l(o.MatCapBlend,1),l(o.MatCapBlendMode,1),l(o.MatCapEnableLighting,1),l(o.MatCapMainStrength,0))},u.uMc2={value:new t.Vector2(l(o.MatCapNormalStrength,1),l(o.MatCapShadowMask,0))},u.uMcCol={value:ce(o.MatCapColor,[1,1,1,1])},u.uMcTex={value:f.MatCapTex};const w=o.MatCapTex_ST||[1,1,0,0];u.uMcST={value:new t.Vector4(w[0],w[1],w[2],w[3])},f.MatCapBlendMask&&(h.HAS_MCMASK="",u.uMcMask={value:f.MatCapBlendMask})}return l(o.UseMatCap2nd,0)>.5&&f.MatCap2ndTex&&(h.LIL_MATCAP2="",u.uMd={value:new t.Vector4(l(o.MatCap2ndBlend,1),l(o.MatCap2ndBlendMode,1),l(o.MatCap2ndEnableLighting,1),l(o.MatCap2ndMainStrength,0))},u.uMd2={value:new t.Vector2(l(o.MatCap2ndNormalStrength,1),l(o.MatCap2ndShadowMask,0))},u.uMdCol={value:ce(o.MatCap2ndColor,[1,1,1,1])},u.uMdTex={value:f.MatCap2ndTex},f.MatCap2ndBlendMask&&(h.HAS_MDMASK="",u.uMdMask={value:f.MatCap2ndBlendMask})),l(o.UseRim,0)>.5&&(h.LIL_RIM="",u.uRim={value:new t.Vector4(l(o.RimBorder,.5),l(o.RimBlur,.1),l(o.RimFresnelPower,3),l(o.RimEnableLighting,1))},u.uRim2={value:new t.Vector4(l(o.RimShadowMask,0),l(o.RimMainStrength,0),l(o.RimBlendMode,1),l(o.RimNormalStrength,1))},u.uRimCol={value:ce(o.RimColor,[.66,.5,.48,1])},f.RimColorTex&&(h.HAS_RIMTEX="",u.uRimTex={value:f.RimColorTex})),l(o.UseEmission,0)>.5&&(h.LIL_EMI="",u.uEm={value:new t.Vector4(l(o.EmissionBlend,1),l(o.EmissionBlendMode,1),l(o.EmissionMainStrength,0),0)},u.uEmCol={value:ce(o.EmissionColor,[1,1,1,1])},f.EmissionMap&&(h.HAS_EMTEX="",u.uEmTex={value:f.EmissionMap}),f.EmissionBlendMask&&(h.HAS_EMMASK="",u.uEmMask={value:f.EmissionBlendMask})),l(o.UseEmission2nd,0)>.5&&(h.LIL_EMI2="",u.uEn={value:new t.Vector4(l(o.Emission2ndBlend,1),l(o.Emission2ndBlendMode,1),l(o.Emission2ndMainStrength,0),0)},u.uEnCol={value:ce(o.Emission2ndColor,[1,1,1,1])},f.Emission2ndMap&&(h.HAS_ENTEX="",u.uEnTex={value:f.Emission2ndMap})),Object.assign(b.defines,h),b.onBeforeCompile=w=>{Object.assign(w.uniforms,qe,u),w.fragmentShader=w.fragmentShader.replace("#include <gradientmap_pars_fragment>",`#include <gradientmap_pars_fragment>
`+Pt).replace("#include <lights_fragment_begin>",en).replace("#include <lights_fragment_maps>","").replace("#include <lights_fragment_end>","").replace("vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;","vec3 outgoingLight = col;")},b.customProgramCacheKey=()=>"choochie-lil-1",b.name=s.name,b.userData.lil=o,b.userData.u=u,b}function nn(s,o){const f=o.map(({m:h,P:u,T:$})=>{if(!u||!/Outline/i.test(u.shader||"")||h.transparent)return null;const w=dt(u.OutlineColor,[.6,.56,.73,1]),O=new t.MeshBasicMaterial({map:h.map||Rt(),color:new t.Color(1,1,1),side:t.BackSide,alphaTest:h.alphaTest||0}),I={uOW:{value:l(u.OutlineWidth,.08)*.01},uOC:{value:new t.Vector3(w.r,w.g,w.b)},uOMain:{value:u.OutlineTexIsMain?1:0}},U={};return $.OutlineWidthMask&&(U.HAS_OWMASK="",I.uOWMask={value:$.OutlineWidthMask}),Object.assign(O.defines=O.defines||{},U),O.onBeforeCompile=G=>{Object.assign(G.uniforms,I),G.vertexShader=`uniform float uOW;
#ifdef HAS_OWMASK
uniform sampler2D uOWMask;
#endif
`+G.vertexShader.replace("#include <begin_vertex>",`vec3 transformed = vec3( position );
float ow = uOW;
#ifdef HAS_OWMASK
ow *= textureLod( uOWMask, uv, 0.0 ).r;
#endif
{ vec4 wp = modelMatrix * vec4( position, 1.0 ); ow *= mix( 1.0, clamp( length( cameraPosition - wp.xyz ), 0.0, 1.0 ), 0.5 ); }`).replace("#include <skinning_vertex>",`#include <skinning_vertex>
#ifdef USE_SKINNING
transformed += normalize( objectNormal ) * ow;
#else
transformed += normalize( normal ) * ow;
#endif`),G.fragmentShader=`uniform vec3 uOC; uniform float uOMain;
`+G.fragmentShader.replace("#include <color_fragment>",`#include <color_fragment>
 diffuseColor.rgb = uOC * mix( vec3( 1.0 ), diffuseColor.rgb, uOMain );`)},O.customProgramCacheKey=()=>"choochie-outline-2",O.userData.u=I,O});if(!f.some(Boolean))return null;const X=new t.MeshBasicMaterial({visible:!1}),b=f.map(h=>h||X);let p;return s.isSkinnedMesh?(p=new t.SkinnedMesh(s.geometry,Array.isArray(s.material)?b:b[0]),p.bind(s.skeleton,s.bindMatrix),p.bindMode=s.bindMode):p=new t.Mesh(s.geometry,Array.isArray(s.material)?b:b[0]),s.morphTargetInfluences&&(p.morphTargetInfluences=s.morphTargetInfluences,p.morphTargetDictionary=s.morphTargetDictionary),p.frustumCulled=!1,p.name=s.name+"_outline",p.userData.outline=!0,p}const ye=new t.Vector3,q=new t.Vector3,Xe=new t.Vector3,Z=new t.Quaternion,Ae=new t.Quaternion,cn=new t.Matrix4;function on(s,o,f){const X=a=>a?s.getObjectByName(a):null,b=.016666666666666666,p=[],h=[];s.updateMatrixWorld(!0);for(const a of o.spheres||[]){const y=X(a.bone);y&&h.push({b:y,off:new t.Vector3().fromArray(a.offset),r:a.r,head:a.tag==="head",c:new t.Vector3})}const u=h.findIndex(a=>a.head),$=(a,y)=>y.copy(a.off).applyMatrix4(a.b.matrixWorld);for(const a of o.springs||[]){const y=new t.Vector3().fromArray(a.gravity);for(const[d,E,k]of a.joints){const N=X(d),J=X(E);if(!N||!J||!N.parent)continue;const de=N.getWorldScale(ye).x,K={t:N,g:a,grav:y,hair:!!k,localRot:N.quaternion.clone(),axis:J.position.clone().normalize(),len:Math.max(.005,J.position.length()*de),cur:J.getWorldPosition(new t.Vector3),prev:new t.Vector3,allow:null,headRest:-1};K.prev.copy(K.cur),p.push(K)}}for(const a of h)$(a,a.c);for(const a of p)a.g.collide&&(a.allow=h.map(y=>Math.min(y.r+(a.g.radius||0),a.cur.distanceTo(y.c)-.002))),a.hair&&u>=0&&(a.headRest=a.cur.distanceTo(h[u].c));const w=o.breasts||{},O=X(w.chest),I=(w.bones||[]).map(a=>{const y=X(a.bone);return y?{t:y,rest:y.quaternion.clone(),side:a.side||1,tail:new t.Vector3().fromArray(a.tail),x:new t.Vector3,v:new t.Vector3}:null}).filter(Boolean),U={k:w.stiffness||46,c:w.damping||3.6,inertia:w.inertia||.06,maxOff:w.maxOffset||.08,kick:w.kickScale||1.8,maxDeg:Math.min(24,w.maxDegrees||34),breathing:w.breathing||.06,grav:w.gravityPull||1.9},G=new t.Vector3,V=new t.Vector3,me=new t.Vector3;let Be=!1;O&&(O.getWorldQuaternion(Z),G.set(0,-1,0).applyQuaternion(Z.invert()));let se=0,Ee=0,_e=0,we=0,ve=null,ue=0;const he=new t.Quaternion,v=new t.Vector3,M=new t.Vector3,_=new t.Vector3,B=new t.Vector3;function pe(){for(const a of p)a.t.quaternion.copy(a.localRot),a.t.updateWorldMatrix(!0,!1),a.cur.copy(a.axis).multiplyScalar(a.len/Math.max(1e-5,a.t.getWorldScale(ye).x)).applyMatrix4(a.t.matrixWorld),a.prev.copy(a.cur);for(const a of I)a.x.set(0,0,0),a.v.set(0,0,0);Be=!1,_e++}function F(a){for(const d of h)$(d,d.c);const y=u>=0?h[u].c:null;for(const d of p){const E=d.t,k=d.g;E.quaternion.copy(d.localRot),E.parent.updateWorldMatrix(!0,!1),E.parent.getWorldQuaternion(he),v.copy(d.axis).applyQuaternion(d.localRot).applyQuaternion(he).normalize(),M.copy(E.position).applyMatrix4(E.parent.matrixWorld),B.subVectors(d.cur,M);const N=B.length(),J=N>1e-5?B.multiplyScalar(1/N):Xe.copy(v),de=Math.min(1,Math.max(0,J.dot(v))),K=f?Math.min(.85,k.drag+.2):k.drag,te=(1-(k.falloff||0)*de)*a*a;_.copy(d.cur).addScaledVector(ye.subVectors(d.cur,d.prev),1-K).addScaledVector(v,k.stiffness*a*d.len*6).addScaledVector(d.grav,te),B.subVectors(_,M);let ne=B.length();const oe=ne>1e-5?B.multiplyScalar(1/ne):B.copy(v);let D=t.MathUtils.radToDeg(Math.acos(Math.min(1,Math.max(-1,oe.dot(v)))));if(D>90?(oe.copy(v),d.prev.copy(M).addScaledVector(v,d.len),d.cur.copy(d.prev),D=0):D>k.maxAngle&&Y(oe,v,k.maxAngle/D),_.copy(M).addScaledVector(oe,d.len),k.collide&&d.allow)for(let ee=0;ee<h.length;ee++){const ae=d.allow[ee];if(!(ae>0))continue;q.subVectors(_,h[ee].c);const fe=q.length();fe<ae&&fe>1e-5&&(_.copy(h[ee].c).addScaledVector(q,ae/fe),q.subVectors(_,M).normalize(),_.copy(M).addScaledVector(q,d.len))}if(d.headRest>0&&y){q.subVectors(_,y);const ee=q.length(),ae=d.headRest-.003;ee<ae&&ee>1e-5&&(_.copy(y).addScaledVector(q,ae/ee),q.subVectors(_,M).normalize(),_.copy(M).addScaledVector(q,d.len))}B.subVectors(_,M).normalize();const W=t.MathUtils.radToDeg(Math.acos(Math.min(1,Math.max(-1,B.dot(v)))));W>k.maxAngle&&(W>90?B.copy(v):Y(B,v,k.maxAngle/W),_.copy(M).addScaledVector(B,d.len)),we=Math.max(we,Math.min(W,k.maxAngle)),d.prev.copy(d.cur),d.cur.copy(_),Z.setFromUnitVectors(v,B.subVectors(_,M).normalize()),Ae.copy(he).multiply(d.localRot),Z.multiply(Ae),E.quaternion.copy(he.invert().multiply(Z)),E.updateMatrixWorld(!1)}}function Y(a,y,d){Z.setFromUnitVectors(y,a),Ae.identity().slerp(Z,d),a.copy(y).applyQuaternion(Ae).normalize()}function T(a,y){if(!O||!I.length)return;O.updateWorldMatrix(!0,!1);const d=ye.setFromMatrixPosition(O.matrixWorld);Be||(V.copy(d),me.set(0,0,0),Be=!0);const E=q.subVectors(d,V).divideScalar(a),k=Xe.subVectors(E,me).divideScalar(a);V.copy(d),me.copy(E),k.length()>60&&k.setLength(60),O.getWorldQuaternion(Z);const N=Z.clone().invert(),J=k.applyQuaternion(N),de=new t.Vector3(0,-1,0).applyQuaternion(N).sub(G).multiplyScalar(U.grav);let K=Math.sin(Ee*1.7)*U.breathing;y&&(K+=Math.sin(Ee*10)*1.5*.7*(f?.4:1));for(const te of I){const ne=a/3;for(let oe=0;oe<3;oe++){const D=q.copy(te.x).multiplyScalar(-U.k).addScaledVector(te.v,-U.c).addScaledVector(J,-U.inertia).add(de);D.y+=K,te.v.addScaledVector(D,ne),te.x.addScaledVector(te.v,ne)}te.x.length()>U.maxOff&&te.x.setLength(U.maxOff)}}function P(){if(!(!O||!I.length)){O.updateWorldMatrix(!0,!1),O.getWorldQuaternion(Ae);for(const a of I){a.t.quaternion.copy(a.rest),a.t.updateWorldMatrix(!0,!1),a.t.getWorldQuaternion(Z);const y=ye.copy(a.tail).applyQuaternion(Z).normalize(),d=q.copy(a.x).applyQuaternion(Ae),E=Xe.crossVectors(y,d.clone().normalize()),k=Math.min(1,a.x.length()/Math.max(1e-4,U.maxOff))*U.maxDeg*(f?.5:1);if(E.lengthSq()>1e-8){const J=new t.Quaternion().setFromAxisAngle(E.normalize(),t.MathUtils.degToRad(k)).multiply(Z);a.t.parent.getWorldQuaternion(Z),a.t.quaternion.copy(Z.invert().multiply(J))}a.t.updateMatrixWorld(!0)}}}return{count:p.length,sides:I.length,update(a,y){const d=u>=0?h[u].b:null;if(d){d.updateWorldMatrix(!0,!1);const k=ye.setFromMatrixPosition(d.matrixWorld);ve&&k.distanceTo(ve)>.35&&(pe(),se=0),ve=(ve||new t.Vector3).copy(k)}if(a>1){pe(),se=0;return}se+=a;let E=0;for(;se>=b&&E<6;)se-=b,Ee+=b,F(b),T(b,y),E++;if(E===6&&(se=0),!E)for(const k of p);P()},reset:pe,kickChest(a,y){for(const d of I)d.v.add(new t.Vector3((y||0)*d.side*.6+(y||0)*.4,a,-Math.abs(a)*.3).multiplyScalar(U.kick*(f?.5:1)))},nudge(a,y){for(const d of p)a(d)&&d.cur.add(y)},nodesOf:a=>p.filter(y=>y.g.name===a),get stats(){return{nodes:p.length,sides:I.length,resets:_e,maxAngle:Math.round(we),chest:I.map(a=>+a.x.length().toFixed(4))}}}}const ft={head:{mood:"sweet",gest:["shy","nod"],lines:["mm~ okay, that's nice.","pat pat... don't stop.","*leans into your hand*","hehe~ good human.","you're messing up my hair~ ...keep going though.","ok fine, you're allowed. for now."]},headMore:{mood:"happy",lines:["okay okay, I'm melting~","purr... wait. I didn't say that.","you're gonna make me sleepy~","mmh. five more minutes of this."]},face:{mood:"pouty",gest:["pout"],lines:["hey! my cheek is not a button.","*puffs cheeks*","boop yourself.","rude~","do that again and I bite.","squish... rude."]},chest1:{mood:"shy",gest:["shy"],lines:["h-hey! hands where I can see them~","excuse me?!","*squeak* ...rude.","wow. not even a hello first?"]},chest2:{mood:"bratty",gest:["smug","no"],lines:["touchy today, aren't we?","eyes up here~","that's not a button either, dummy.","careful. I keep a list."]},chest3:{mood:"pouty",gest:["no","angry"],lines:["okay, that's enough of that.","hands off~ I mean it.","keep that up and you're in timeout.","nope. we're done with that, dummy."]},chestBold:{mood:"smug",gest:["smug"],lines:["bold of you. buy me dinner first~","you're brave today... careful~","mm, someone's feeling confident.","cute. you wish~"]},belly:{mood:"laugh",gest:["laugh"],lines:["hey! that tickles!","*giggles* stop~","my tummy is off-limits.","nooo not the tummy~"]},hips:{mood:"bratty",gest:["no"],lines:["hands. up. here.","nuh-uh~","excuse you?","careful, dummy."]},legs:{mood:"bratty",gest:["stomp"],lines:["my legs aren't a drum, dummy.","careful, I kick~","these boots are for stomping."]},hand:{mood:"happy",gest:["wave"],lines:["hi~ *holds your finger*","you wanna hold hands? ...fine.","*high five*","hehe. hi."]},arm:{mood:"sweet",lines:["hm? you need something?","*pokes you back*","yes? I'm listening~"]},ears:{mood:"shy",lines:["ears are sensitive!","*ear flick*","mmh... the ears, huh? okay, you can stay.","they twitch when you do that~"]},tail:{mood:"pouty",lines:["don't pull the tail!","*tail swish* ...rude.","the tail is NOT a handle."]},wings:{mood:"smug",lines:["careful, they're delicate~","*flutters*","pretty, right?"]},spam:{mood:"jealous",gest:["angry"],lines:["okay, what are you doing.","I'm not a stress ball~","click me one more time, I dare you.","do you need a hobby?"]}};async function an(s,o){let f;try{f=new t.WebGLRenderer({canvas:s,antialias:!0,alpha:!0,powerPreference:"high-performance"})}catch{throw new Error("webgl")}if(!f.getContext())throw new Error("webgl");f.setPixelRatio(Math.min(window.devicePixelRatio||1,2)),f.outputColorSpace=t.SRGBColorSpace,f.toneMapping=t.NoToneMapping,f.setClearColor(0,0);const X=Math.min(8,f.capabilities.getMaxAnisotropy?f.capabilities.getMaxAnisotropy():1),b=new t.Scene,p=new t.PerspectiveCamera(26,1,.05,50);let h=p;const u=document.createElement("canvas");u.width=u.height=128;const $=u.getContext("2d"),w=$.createRadialGradient(64,64,4,64,64,64);w.addColorStop(0,"rgba(10,2,6,0.55)"),w.addColorStop(1,"rgba(10,2,6,0)"),$.fillStyle=w,$.fillRect(0,0,128,128);const O=new t.CanvasTexture(u);O.colorSpace=t.SRGBColorSpace;const I=new t.Mesh(new t.PlaneGeometry(.9,.55),new t.MeshBasicMaterial({map:O,transparent:!0,depthWrite:!1,toneMapped:!1}));I.rotation.x=-Math.PI/2,I.position.y=.002,b.add(I);const U=new qt;U.setMeshoptDecoder(Kt);const G=await new Promise((e,i)=>U.load(Xt,e,n=>{const r=n.total||Gt;o&&r&&o(Math.min(.99,n.loaded/r))},i)),V=G.scene;b.add(V);const me=new Map,Be=G.parser.json,se=(Be.images||[]).map(e=>e.name||"");async function Ee(e){const i=typeof e=="string"?se.indexOf(e):-1;if(i<0)return null;if(me.has(i))return me.get(i);const n=G.parser.loadImageSource(i,G.parser.textureLoader).then(r=>(r.flipY=!1,r.colorSpace=/^nm_|_lin(_a)?$/.test(e)?t.NoColorSpace:t.SRGBColorSpace,r.wrapS=r.wrapT=/^mc_/.test(e)?t.ClampToEdgeWrapping:t.RepeatWrapping,r.magFilter=t.LinearFilter,r.minFilter=t.LinearMipmapLinearFilter,r.generateMipmaps=!0,r.needsUpdate=!0,r)).catch(()=>null);return me.set(i,n),n}const _e=[];V.traverse(e=>{e.isMesh&&_e.push(e)});const we=[];for(const e of _e){e.frustumCulled=!1;const i=Array.isArray(e.material)?e.material:[e.material],n=await Promise.all(i.map(async L=>{const x=L.userData&&L.userData.lil||{},A={};for(const[S,R]of Object.entries(x.tex||{})){const c=await Ee(R);c&&(A[S]=c)}return{m:L,P:x,T:A}})),r=n.map(({m:L,P:x,T:A})=>tn(L,x,A,X)),m=nn(e,n);e.material=Array.isArray(e.material)?r:r[0],m&&e.add(m),e.morphTargetDictionary&&"Eyes_blink"in e.morphTargetDictionary&&we.push(e);const g=Math.max(...n.map(L=>L.P.queue||2e3));e.renderOrder=g>=2450?(g-2e3)/10:0}o&&o(1);const ve=we,ue=V.userData&&V.userData.physics,he=ue&&ue.humanoid||{},v=e=>he[e]?V.getObjectByName(he[e]):null,M=ue?on(V,ue,le):null,_=new t.AnimationMixer(V),B={};G.animations.forEach(e=>B[e.name]=e);const pe={},F=new Map;let Y=B.idle?"idle":Object.keys(B)[0]||null,T=null,P=null,a=null,y=0,d="";function E(){return!T&&Y&&(T=_.clipAction(B[Y]),T.setLoop(t.LoopRepeat,1/0)),T&&!T.isRunning()&&(T.enabled=!0,T.paused=!1,T.play()),T}function k(e,i){if(e){F.has(e)||(F.set(e,{w:0,target:1,fade:i}),e.setEffectiveWeight(0));for(const[n,r]of F)r.target=n===e?1:0,r.fade=i}}function N(e){let i=0;for(const[n,r]of F){const m=e/Math.max(.05,r.fade);if(r.w=r.target>r.w?Math.min(r.target,r.w+m):Math.max(r.target,r.w-m),r.w<=0&&r.target===0){n.stop(),F.delete(n);continue}i+=r.w}if(i<.001){const n=E();if(!n)return;F.clear(),F.set(n,{w:1,target:1,fade:.4}),i=1,P&&(P=null,a=null)}for(const[n,r]of F)n.enabled=!0,n.setEffectiveWeight(r.w/i)}E(),k(T,.01),N(1);function J(e){!B[e]||e===Y||(Y=e,T=_.clipAction(B[e]),T.setLoop(t.LoopRepeat,1/0),T.isRunning()||T.reset().play(),P||k(T,.6))}function de(){P=null,a=null,k(E(),.5)}function K(e,i){const n=je[e]||(B[e]?[e]:null);if(!n||le&&!i)return null;let r=n.filter(A=>B[A]);if(!r.length)return null;r.length>2&&d&&(r=r.filter(A=>A!==d));const m=r[Math.floor(Math.random()*r.length)];n.length>2&&(d=m);let g=_.clipAction(B[m]);const L=F.get(g);L&&L.w>.02&&(pe[m]=pe[m]||_.clipAction(B[m].clone()),g=pe[m]);const x=Yt[m]||1;return g.reset(),g.setLoop(x>1?t.LoopRepeat:t.LoopOnce,x),g.clampWhenFinished=!0,g.play(),F.has(g)&&(F.get(g).w=0,g.setEffectiveWeight(0)),k(g,.32),P=g,a=m,y=performance.now()+(g.getClip().duration*x+1.2)*1e3,e}_.addEventListener("finished",e=>{e.action===P&&de()});let te=performance.now()+22e3;const ne={},oe={};function D(e,i){ne[e]=i}let W=null,ee=0,ae=0,fe=0,mt=!1;function xe(e,i){const n=ut[e]||ut.bratty;return W&&W!==n.face&&D(W,0),W=n.face,ee=n.faceAmt||.85,ae=performance.now()+(i||7e3),fe=n.blush||0,mt=!!n.mouthOwned,n.idle?J(n.idle):(Y==="idle_sad"||Y==="idle_happy")&&J("idle"),n}let re=null,ge=null,be=null,Se=null,Ce=!1;function ht(){if(!re){const e=window.AudioContext||window.webkitAudioContext;if(!e)return null;re=new e,ge=re.createAnalyser(),ge.fftSize=1024,be=new Float32Array(ge.fftSize),ge.connect(re.destination)}return re.state==="suspended"&&re.resume().catch(()=>{}),re}async function Tt(e,i){const n=ht();if(!n)return 0;pt();const r=await n.decodeAudioData(e.slice(0)),m=n.createBufferSource();return m.buffer=r,m.connect(ge),Se=m,Ce=!0,m.onended=()=>{Se===m&&(Ce=!1,Se=null)},m.start(),i&&i(r.duration),r.duration}function pt(){if(Se){try{Se.stop()}catch{}Se=null}Ce=!1}let ke=0,Ge=0,Le=0;function Ot(){if(!Ce||!ge)return 0;ge.getFloatTimeDomainData(be);let e=0;for(let n=0;n<be.length;n++)e+=be[n]*be[n];const i=Math.sqrt(e/be.length);return Math.min(1,Math.max(0,(i-.012)*7))}const Q=v("Head")||V.getObjectByName("Head"),He=v("Neck")||V.getObjectByName("Neck"),Ve=v("Spine"),Ye=v("UpperChest")||v("Chest");let Je=0,Ze=0,gt=0,Mt=0,Fe=1;const ze=e=>Math.max(-1,Math.min(1,e||0));le||window.addEventListener("pointermove",e=>{gt=ze((e.clientX/innerWidth-.5)*2),Mt=ze((e.clientY/innerHeight-.5)*2)},{passive:!0});const yt=new t.Quaternion,wt=new t.Euler,Ue=[Q,He,Ve,Ye].filter(Boolean).map(e=>({b:e,saved:new t.Quaternion,x:0,y:0,z:0,vx:0,vy:0,vz:0})),It=e=>Ue.find(i=>i.b===e);function $e(e,i,n,r){const m=e&&It(e);if(!m)return;const g=le?.4:1;m.vx+=i*g,m.vy+=n*g,m.vz+=r*g}let Re=0,Te=1.6;if(_.update(0),V.updateMatrixWorld(!0),Q){const e=new t.Vector3;Q.getWorldPosition(e),e.y>.3&&(Te=e.y*1.17)}I.scale.setScalar(Te/1.6),M&&M.reset();let z=null;function Oe(){const e=s.clientWidth||innerWidth,i=s.clientHeight||innerHeight;if(f.setSize(e,i,!1),z){const c=e/i,C=z.size;z.cam.left=-C*c,z.cam.right=C*c,z.cam.top=C,z.cam.bottom=-C,z.cam.updateProjectionMatrix();return}p.aspect=e/i;const n=e/i<.85,r=Te*(n?.38:.16),m=Te*1.04,g=t.MathUtils.degToRad(p.fov/2),L=Math.max((m-r)/2/Math.tan(g),Te*.27/(Math.tan(g)*p.aspect)),x=2*L*Math.tan(g),A=m+x*(64/i)-x/2,S=e>=1e3?Math.min(.42,(e-1e3)/2400+.18):0,R=2*L*Math.tan(g)*p.aspect;Re=S*R/2,p.position.set(Re,A+.02,L),p.lookAt(Re,A,0),V.position.x=0,I.position.x=0,p.updateProjectionMatrix()}Oe(),addEventListener("resize",Oe);const Pe=new t.Raycaster,vt=new t.Vector2,ie=e=>e?e.getWorldPosition(new t.Vector3):null,Dt=M?M.nodesOf("Ears"):[],Wt=M?M.nodesOf("Tail"):[],Ht=M?M.nodesOf("Wings"):[],et=new t.Quaternion;Q&&Q.getWorldQuaternion(et);const Ft=ue&&ue.breasts?(ue.breasts.bones||[]).map(e=>V.getObjectByName(e.bone)).filter(Boolean):[];function zt(e,i,n,r){const m=ye.subVectors(r,n),g=q.subVectors(e,n),L=m.dot(m),x=m.dot(i),A=m.dot(g),S=i.dot(g),R=L-x*x;let c=R>1e-8?(A-x*S)/R:0;c=Math.max(0,Math.min(1,c));const C=Xe.copy(n).addScaledVector(m,c),H=Math.max(0,i.dot(q.subVectors(C,e)));return[C.distanceTo(q.copy(e).addScaledVector(i,H)),H]}function Ne(e,i){if(!Q)return null;const n=s.getBoundingClientRect();vt.set((e-n.left)/n.width*2-1,-((i-n.top)/n.height)*2+1),Pe.setFromCamera(vt,h);const r=Pe.ray.origin,m=Pe.ray.direction;V.updateMatrixWorld(!0);const g=[],L=(c,C,H,Qe)=>{c&&C&&g.push([ie(c),ie(C),H,Qe])},x=(c,C,H)=>{c&&g.push([c,c,C,H])},A=ie(Q).add(new t.Vector3(0,.07,0).applyQuaternion(Q.getWorldQuaternion(new t.Quaternion).multiply(et.clone().invert())));x(A,.115,"head"),L(He,Q,.05,"face"),L(Ye,He,.115,"chest");for(const c of Ft)x(ie(c).add(new t.Vector3(0,0,.03)),.075,"chest");L(Ve,Ye,.11,"belly");const S=v("Hips");if(S&&Ve){const c=ie(S);g.push([c.clone().add(new t.Vector3(0,-.04,0)),c.lerp(ie(Ve),.35),.12,"hips"])}for(const c of["Left","Right"])L(v(c+"UpperArm"),v(c+"LowerArm"),.045,"arm"),L(v(c+"LowerArm"),v(c+"Hand"),.04,"arm"),x(ie(v(c+"Hand"))&&ie(v(c+"Hand")).lerp(ie(v(c+"MiddleProximal"))||ie(v(c+"Hand")),.6),.065,"hand"),L(v(c+"UpperLeg"),v(c+"LowerLeg"),.08,"legs"),L(v(c+"LowerLeg"),v(c+"Foot"),.06,"legs"),x(ie(v(c+"Foot")),.07,"legs");for(const c of Dt)x(c.cur.clone(),.045,"ears");for(const c of Wt)x(c.cur.clone(),.05,"tail");for(const c of Ht)x(c.cur.clone(),.07,"wings");let R=null;for(const[c,C,H,Qe]of g){const[ct,jt]=zt(r,m,c,C);if(ct>H)continue;const st=jt-Math.sqrt(Math.max(0,H*H-ct*ct));(!R||st<R.t-.01||Qe==="chest"&&R.region==="belly"&&Math.abs(st-R.t)<.03)&&(R={t:st,region:Qe})}if(R&&R.region==="head"){const c=r.clone().addScaledVector(m,R.t),C=c.sub(A),H=new t.Vector3(0,0,1).applyQuaternion(Q.getWorldQuaternion(new t.Quaternion).multiply(et.clone().invert()));C.dot(H)>.03&&C.y<0&&(R.region="face")}return R}const Ut=()=>{try{const e=document.getElementById("adult");return e&&e.checked||localStorage.getItem("choochie.webAdult")==="1"}catch{return!1}},Ie=[],xt={};let bt=0,St=0,De=0,Ct=0,We=0,kt=0,tt=null,Lt=0;function Nt(e){const i=ft[e].lines;let n=Math.floor(Math.random()*i.length);return i.length>1&&n===xt[e]&&(n=(n+1)%i.length),xt[e]=n,i[n]}function Qt(e){const i=document.getElementById("caption"),n=document.getElementById("caption-t");if(!i||!n||Ce||i.classList.contains("think")||document.body.classList.contains("flat"))return;n.textContent=e,i.classList.add("on");const r=++Lt;setTimeout(()=>{r===Lt&&n.textContent===e&&i.classList.remove("on")},2600+e.length*40)}function nt(e,i){const n=performance.now();for(;Ie.length&&n-Ie[0]>4e3;)Ie.shift();Ie.push(n),e==="chest"&&M&&M.kickChest(le?.5:1.3,(Math.random()-.5)*.8),e==="head"&&($e(Q,.05,0,0),M&&M.nudge(A=>A.hair,new t.Vector3(0,-.006,0))),e==="face"&&$e(Q,0,(Math.random()<.5?-1:1)*.07,.04),(e==="belly"||e==="hips")&&$e(Ve,-.06,0,0),e==="ears"&&M&&M.nudge(A=>A.g.name==="Ears",new t.Vector3((Math.random()-.5)*.02,.01,0)),e==="tail"&&M&&M.nudge(A=>A.g.name==="Tail",new t.Vector3((Math.random()-.5)*.06,.02,0)),e==="wings"&&M&&M.nudge(A=>A.g.name==="Wings",new t.Vector3(0,.02,0));let r=e==="arm"?"arm":e;if(e==="head"&&i==="stroke"){if(We=n-kt<6e3?We+1:1,kt=n,We>3)r="headMore";else if(We>1&&We%2===0){xe("sweet",2500),D("Overlay_blush",.4);return}}if(e==="chest"&&(De=n-Ct<45e3?De+1:1,Ct=n,r=De>=4?"chest3":De>=2?Ut()&&De===2?"chestBold":"chest2":"chest1"),Ie.length>=7&&e!=="head"&&(r="spam"),n-bt<1100){xe(ft[r].mood,2200);return}bt=n;const m=ft[r],g=Nt(r);xe(m.mood,3200+g.length*30),(r.startsWith("chest")||r==="ears")&&(fe=Math.max(fe,r==="chest3"?.5:.85));const L=P&&a&&(_t.test(a)||a==="thinking");m.gest&&!L&&n-St>4500&&Math.random()<(r==="spam"||r==="chest3"?1:.45)&&(St=n,K(m.gest[Math.floor(Math.random()*m.gest.length)],!le));const x={region:e,line:g,mood:m.mood};if(tt)try{tt(x)}catch{}else Qt(g);window.dispatchEvent(new CustomEvent("stage-touch",{detail:x}))}let j=null;s.addEventListener("pointermove",e=>{if(z)return;if(j&&j.region==="head"&&e.pointerId===j.id){j.travel+=Math.hypot(e.clientX-j.x,e.clientY-j.y),j.x=e.clientX,j.y=e.clientY,j.travel>45&&(j.travel=0,j.strokes++,Ne(e.clientX,e.clientY)&&nt("head","stroke"));return}if(e.pointerType!=="mouse")return;const i=Ne(e.clientX,e.clientY);s.style.cursor=i?i.region==="head"?"grab":"pointer":""},{passive:!0}),s.addEventListener("pointerdown",e=>{if(z||e.pointerType==="mouse"&&e.button!==0)return;const i=Ne(e.clientX,e.clientY);if(i){if(j={id:e.pointerId,region:i.region,x:e.clientX,y:e.clientY,travel:0,strokes:0},i.region==="head"){s.style.cursor="grabbing";try{s.setPointerCapture(e.pointerId)}catch{}}nt(i.region,"tap")}});const At=e=>{j&&e.pointerId===j.id&&(j.region==="head"&&(s.style.cursor=e.pointerType==="mouse"?"grab":""),j=null)};s.addEventListener("pointerup",At),s.addEventListener("pointercancel",At);const ot=performance.now();let at=ot,Bt=ot+1800,Me=-1,it=!0;document.addEventListener("visibilitychange",()=>{it=!document.hidden,it&&(at=performance.now(),requestAnimationFrame(lt))});const rt=new t.Matrix4,Et=new t.Quaternion;function lt(e){if(!it)return;const i=Math.max(0,(e-at)/1e3),n=Math.min(.05,i);at=e,z||(P&&e>y&&de(),N(n),_.update(n),!P&&e>te&&!le&&(te=e+2e4+Math.random()*15e3,(Y==="idle"||Y==="idle_shift")&&J(Y==="idle"?"idle_shift":"idle"))),W&&(D(W,e<ae?ee:0),e>=ae+600&&(D(W,0),W=null)),D("Overlay_blush",W&&e<ae?fe:0);let r=0;if(!(z||W&&Jt.has(W)&&(oe[W]||0)>.3)&&(e>Bt&&Me<0&&(Me=0,Bt=e+(Math.random()<.12?250:2200+Math.random()*3800)),Me>=0)){Me+=n;const S=.16;r=Math.sin(Math.min(1,Me/S)*Math.PI),Me>S&&(Me=-1)}D("Eyes_blink",r);const g=Ot();ke+=(g-ke)*(1-Math.exp(-n*(g>ke?28:16)));const L=mt?.35:1,x=ke>.02?ke*L:0;Ge-=n,Ge<0&&(Ge=.09+Math.random()*.1,Le=Math.floor(Math.random()*5)),D("jawOpen",x*.55),D("v_aa",Le===0||Le===3?x*.7:x*.25),D("v_oh",Le===1?x*.55:0),D("v_ih",Le===2?x*.45:0),D("v_ou",Le===1?x*.2:0);for(const S in ne){const c=S==="Eyes_blink"||S.startsWith("v_")||S==="jawOpen"||z?ne[S]:(oe[S]||0)+(ne[S]-(oe[S]||0))*(1-Math.exp(-n*7));oe[S]=c;for(const C of ve){const H=C.morphTargetDictionary[S];H!=null&&(C.morphTargetInfluences[H]=c)}}const A=!z;if(A){for(const c of Ue){c.saved.copy(c.b.quaternion);for(const C of["x","y","z"]){const H="v"+C;c[H]+=(-c[C]*160-c[H]*18)*n,c[C]+=c[H]*n,c[C]=Math.max(-.3,Math.min(.3,c[C]))}}let S=0,R=0;Q&&!le&&(Fe+=((a&&_t.test(a)?.15:1)-Fe)*(1-Math.exp(-n*4)),Je+=(gt-Je)*(1-Math.exp(-n*3)),Ze+=(Mt-Ze)*(1-Math.exp(-n*3)),S=ze(Je)*.22*Fe,R=ze(Ze)*.12*Fe);for(const c of Ue){const C=c.b===Q?.6:c.b===He?.4:0;wt.set(R*C+c.x,S*C+c.y,c.z),yt.setFromEuler(wt),c.b.quaternion.multiply(yt)}}if(V.updateMatrixWorld(!0),M&&!z&&M.update(i,!!(a&&/^dance|jump|cheer|excited/.test(a))),!le&&!z){const S=(e-ot)/1e3;p.position.x=Re+Math.sin(S*.21)*.025,p.lookAt(Re,p.position.y-.02,0)}if(h.updateMatrixWorld(),rt.copy(h.matrixWorld).invert(),qe.uL.value.copy(Zt).transformDirection(rt),qe.uUp.value.set(0,1,0).transformDirection(rt),V.getWorldQuaternion(Et),qe.uFaceFwd.value.set(0,.25,1).applyQuaternion(Et).normalize(),f.render(b,h),A)for(const S of Ue)S.b.quaternion.copy(S.saved);requestAnimationFrame(lt)}return requestAnimationFrame(lt),{react(e,i,n){const r=i&&i!=="none"&&je[i]?i:null,m=xe(r&&Vt[r]&&!ut[e]?Vt[r]:e,n);return r?K(r,!0):m.gest&&Math.random()<.6?K(m.gest[Math.floor(Math.random()*m.gest.length)],!1):null},gesture:e=>K(e,!0),thinking(e){e?(xe("thinking",6e4),P||K("thinking",!1)):W==="face_smug"&&ee<.5&&(ae=0)},wave(){return xe("happy",4e3),K("wave",!1)},speak:Tt,stopVoice:pt,unlock(){ht()},get audioRunning(){return!!re&&re.state==="running"},get speaking(){return Ce},get mouth(){return ke},set onTouch(e){tt=typeof e=="function"?e:null},touch:(e,i)=>nt(e,i||"tap"),pick:(e,i)=>{const n=Ne(e,i);return n?n.region:null},get state(){let e=0;for(const[n]of F)e+=n.getEffectiveWeight();const i=Q?Q.quaternion:null;return{gesture:a,base:Y,layers:F.size,weight:e,headDeg:i?2*Math.acos(Math.min(1,Math.abs(i.w)))*180/Math.PI:0,physics:M?M.stats:null}},debugView(e){if(!e){z=null,h=p,V.rotation.y=0,f.setClearColor(0,0),Oe();return}const i=new t.OrthographicCamera(-1,1,1,-1,.01,100);i.position.set(e.cx||0,e.cy||.82,10),z={cam:i,size:e.size||.9},h=i,V.rotation.y=t.MathUtils.degToRad(-(e.yaw||0));for(const[n]of F)n.stop();F.clear(),P=null,a=null,Y="idle",T=null,E(),T.time=0,k(T,.01),N(1),_.update(0);for(const n in ne)ne[n]=0;W=null,M&&(V.updateMatrixWorld(!0),M.reset()),f.setClearColor(e.bg||2565673,1),Oe()},get _three(){return{THREE:t,scene:b,root:V,renderer:f,camera:h,physics:M}},resize:Oe,clips:Object.keys(B),gestures:Object.keys(je).filter(e=>je[e].some(i=>B[i]))}}(async()=>{const s=document.getElementById("stage"),o=document.getElementById("load-n"),f=document.getElementById("load-bar"),X=document.getElementById("load-pb");try{const b=await an(s,p=>{const h=Math.round(p*100);o&&(o.textContent=h+"%"),f&&(f.style.transform="scaleX("+p+")"),X&&X.setAttribute("aria-valuenow",h)});window.ChoochieStage=b,window.dispatchEvent(new Event("stage-ready"))}catch(b){window.ChoochieStageFailed=!0,console.error(b),window.dispatchEvent(new Event("stage-fail"))}})();export{an as start};
