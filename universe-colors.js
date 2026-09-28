/* ============================================================
   INVENTÁRIO GAMER — universe-colors.js
   Paleta por franquia (bloco de cor da página de Universo — backlog item 3).
   Gerada uma vez por script (Oklch: ajusta só a claridade, preserva matiz e
   croma) e gravada aqui como tabela estática — não roda nada disso no
   navegador, só os valores finais.

   seed / seed2: cor(es)-âncora da franquia (seed2 só quando a franquia tem
     uma segunda cor genuinamente conhecida — ex. Mario vermelho+azul do
     macacão; não é forçado em franquia sem essa identidade dupla).
   bg / panel: tons escuros derivados do seed, já ajustados pro piso de
     contraste 4,5:1 (mínimo, sem exceção) contra o texto claro do site e
     contra a logo branca do cabeçalho — meta 7:1 quando o limite de
     deslocamento a partir do tom original da semente permite.
   accent: tom vívido do seed2 (ou do seed, se não houver seed2) usado no FAB
     de Meu Inventário.
   logo: 'white' ou 'black' — qual logo mono usar sobre o bg deste universo.
   fabText: 'white' ou 'black' — cor do ícone/texto dentro do FAB.
   bgContrast / panelContrast: contraste calculado (WCAG), guardado só pra
     auditoria — não é usado em runtime.

   Franquias precisam de 3+ jogos no catalog para ganhar página de universo
   (ver franchiseDirectory em catalog-data.js); Persona é exceção temporária
   (2 jogos hoje, cor reservada para quando cruzar o piso). Uma franquia que
   cruzar o piso e ainda não tiver entrada aqui cai no fallback genérico
   (ver universeColorsFor() em app-1-core.js) até alguém rodar o script de
   novo pra ela.
   ============================================================ */
window.UNIVERSE_COLORS = {
  'Mario': { seed:'#E4000F', seed2:'#0044CC', bg:'#a70008', panel:'#a00007', accent:'#3d7dff', logo:'white', fabText:'black', bgContrast:6.02, panelContrast:7.04 },
  'The Legend of Zelda': { seed:'#1E7B34', seed2:'#D4AF37', bg:'#00561b', panel:'#005a1d', accent:'#a38200', logo:'white', fabText:'black', bgContrast:6.82, panelContrast:7.09 },
  'Pokémon': { seed:'#FFCB05', seed2:'#EE1515', bg:'#7a5f00', panel:'#695200', accent:'#f5221e', logo:'white', fabText:'black', bgContrast:4.58, panelContrast:6.27 },
  'Sonic': { seed:'#0089CF', seed2:'#DA291C', bg:'#00649a', panel:'#005684', accent:'#eb3c2d', logo:'white', fabText:'black', bgContrast:4.81, panelContrast:6.61 },
  'Kirby': { seed:'#F49AC1', seed2:null, bg:'#99486e', panel:'#893a60', accent:'#bb678d', logo:'white', fabText:'black', bgContrast:4.53, panelContrast:6.21 },
  'God of War': { seed:'#7A1F1F', seed2:null, bg:'#7a1f1f', panel:'#892d2b', accent:'#c6655f', logo:'white', fabText:'black', bgContrast:7.79, panelContrast:7.09 },
  'Resident Evil': { seed:'#8A0303', seed2:null, bg:'#8a0303', panel:'#981b14', accent:'#d6584a', logo:'white', fabText:'black', bgContrast:7.59, panelContrast:7.03 },
  'Marvel Spider-Man': { seed:'#1D4ED8', seed2:'#DC2626', bg:'#0a35bf', panel:'#103dc7', accent:'#ec3934', logo:'white', fabText:'black', bgContrast:7, panelContrast:7.02 },
  'Call of Duty': { seed:'#4B5320', seed2:null, bg:'#444b18', panel:'#49511e', accent:'#838c58', logo:'white', fabText:'black', bgContrast:7.01, panelContrast:7.05 },
  'Grand Theft Auto': { seed:'#C21F6E', seed2:null, bg:'#8e004d', panel:'#9a0054', accent:'#de4085', logo:'white', fabText:'black', bgContrast:7.03, panelContrast:7 },
  "Assassin's Creed": { seed:'#8E1B2E', seed2:null, bg:'#8b182c', panel:'#932032', accent:'#d05b64', logo:'white', fabText:'black', bgContrast:7.01, panelContrast:7.06 },
  'Mortal Kombat': { seed:'#B00020', seed2:null, bg:'#930019', panel:'#9f001c', accent:'#e3464a', logo:'white', fabText:'black', bgContrast:7.07, panelContrast:7.04 },
  'Halo': { seed:'#1E8A6E', seed2:null, bg:'#00644e', panel:'#005844', accent:'#349a7d', logo:'white', fabText:'black', bgContrast:5.43, panelContrast:7.09 },
  'Elden Ring': { seed:'#B8912F', seed2:null, bg:'#7e5f00', panel:'#6d5200', accent:'#a68016', logo:'white', fabText:'black', bgContrast:4.5, panelContrast:6.17 },
  'Final Fantasy': { seed:'#3B5BA5', seed2:null, bg:'#25438a', panel:'#2c4a92', accent:'#6083d1', logo:'white', fabText:'black', bgContrast:7.1, panelContrast:7.01 },
  'Diablo': { seed:'#B23A1A', seed2:null, bg:'#892000', panel:'#932300', accent:'#d55a3c', logo:'white', fabText:'black', bgContrast:7.02, panelContrast:7.1 },
  'Street Fighter': { seed:'#D94A1E', seed2:null, bg:'#a62d00', panel:'#912600', accent:'#df5025', logo:'white', fabText:'black', bgContrast:5.29, panelContrast:7.07 },
  'Star Wars': { seed:'#F5D400', seed2:null, bg:'#736300', panel:'#635500', accent:'#9b8600', logo:'white', fabText:'black', bgContrast:4.54, panelContrast:6.23 },
  'Persona': { seed:'#D7001D', seed2:null, bg:'#9b0012', panel:'#a00012', accent:'#f03034', logo:'white', fabText:'black', bgContrast:6.64, panelContrast:7.04 },
  'Metroid': { seed:'#E85D04', seed2:'#F2F2F2', bg:'#ac4200', panel:'#953800', accent:'#868686', logo:'white', fabText:'black', bgContrast:4.51, panelContrast:6.15 },
  'Star Fox': { seed:'#2E9DCC', seed2:null, bg:'#006b91', panel:'#005c7d', accent:'#1d92c0', logo:'white', fabText:'black', bgContrast:4.52, panelContrast:6.21 },
  'F-Zero': { seed:'#E63946', seed2:null, bg:'#b70026', panel:'#9e0020', accent:'#e93c48', logo:'white', fabText:'black', bgContrast:5.23, panelContrast:7.08 },
  'Super Smash Bros.': { seed:'#6A2C91', seed2:null, bg:'#67288d', panel:'#6d2f94', accent:'#a366cf', logo:'white', fabText:'black', bgContrast:7.03, panelContrast:7.07 },
  'WarioWare': { seed:'#C9A227', seed2:null, bg:'#7a6000', panel:'#695200', accent:'#a48100', logo:'white', fabText:'black', bgContrast:4.56, panelContrast:6.25 },
  'Paper Mario': { seed:'#E8813A', seed2:null, bg:'#a04c00', panel:'#8b4100', accent:'#cb6717', logo:'white', fabText:'black', bgContrast:4.52, panelContrast:6.16 },
  'Yoshi': { seed:'#5CB85C', seed2:null, bg:'#057314', panel:'#00630d', accent:'#409d42', logo:'white', fabText:'black', bgContrast:4.56, panelContrast:6.28 },
  'inFAMOUS': { seed:'#2AB6E8', seed2:null, bg:'#006c8d', panel:'#005d7a', accent:'#0093bf', logo:'white', fabText:'black', bgContrast:4.52, panelContrast:6.21 },
  'LittleBigPlanet': { seed:'#B5743C', seed2:null, bg:'#8f5113', panel:'#7e4300', accent:'#b6753d', logo:'white', fabText:'black', bgContrast:4.76, panelContrast:6.53 },
  'Silent Hill': { seed:'#5C5552', seed2:null, bg:'#4d4643', panel:'#534c49', accent:'#8c8481', logo:'white', fabText:'black', bgContrast:7.02, panelContrast:7.07 },
  'Stellar Blade': { seed:'#9C2FA0', seed2:null, bg:'#7e0383', panel:'#87148b', accent:'#bf52c2', logo:'white', fabText:'black', bgContrast:7.12, panelContrast:7.04 },
  'Need for Speed': { seed:'#8FD400', seed2:null, bg:'#486e00', panel:'#3d5e00', accent:'#659800', logo:'white', fabText:'black', bgContrast:4.57, panelContrast:6.28 },
  'Dark Souls': { seed:'#6E5A44', seed2:null, bg:'#56432e', panel:'#5d4a35', accent:'#97826b', logo:'white', fabText:'black', bgContrast:7.1, panelContrast:7.03 },
  'The Elder Scrolls': { seed:'#4B3F72', seed2:null, bg:'#4b3f72', panel:'#514579', accent:'#887db5', logo:'white', fabText:'black', bgContrast:7.06, panelContrast:7.11 },
  'The Witcher': { seed:'#7A5C1E', seed2:null, bg:'#5d4200', panel:'#664801', accent:'#a08145', logo:'white', fabText:'black', bgContrast:7.11, panelContrast:7.04 },
  'EA Sports FC': { seed:'#1E9E4A', seed2:null, bg:'#007330', panel:'#006328', accent:'#21a04c', logo:'white', fabText:'black', bgContrast:4.52, panelContrast:6.24 },
  'Alan Wake': { seed:'#C77B1E', seed2:null, bg:'#905500', panel:'#7d4900', accent:'#bd720c', logo:'white', fabText:'black', bgContrast:4.57, panelContrast:6.24 },
  'Donkey Kong': { seed:'#80502A', seed2:'#F2C94C', bg:'#693b13', panel:'#71421b', accent:'#a38200', logo:'white', fabText:'black', bgContrast:7.11, panelContrast:7.04 }
};
