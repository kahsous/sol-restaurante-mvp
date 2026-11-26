export interface MenuItem {
  name: string;
  desc: string;
  sizes: Record<string, number>;
  note?: string;
}

export interface MenuItemStatic extends Omit<MenuItem, 'sizes'> {
  rangeText: string;
  note: string;
  sizes?: never;
}

export const pratosPrincipais = {
  "Frango": [
    {name:"Isca crocante + batata frita", desc:"Iscas de frango empanadas e fritas até ficarem douradas e crocantes.", sizes:{M:32.20,G:37.95}},
    {name:"Filé grelhado + batata frita", desc:"Filé de frango grelhado na chapa com tempero especial.", sizes:{M:31.05,G:37.95}},
    {name:"Filé empanado + batata frita", desc:"Filé de frango empanado e frito para garantir a crocância.", sizes:{M:32.20,G:37.95}},
  ],
  "Suíno": [
    {name:"Filé grelhado + batata frita", desc:"Filé suíno grelhado, macio e suculento.", sizes:{M:31.05,G:37.95}},
    {name:"Filé empanado + batata frita", desc:"Filé suíno empanado, frito até dourar.", sizes:{M:35.65,G:42.55}},
    {name:"Calabresa acebolada + batata frita", desc:"Calabresa fatiada e acebolada preparada na chapa.", sizes:{M:31.05,G:37.95}},
  ],
  "Bovino": [
    {name:"Bife grelhado + batata frita", desc:"Bife bovino grelhado na chapa, no ponto ideal.", sizes:{M:37.95,G:44.85}},
    {name:"Bife empanado + batata frita", desc:"Bife bovino empanado crocante.", sizes:{M:37.95,G:44.85}},
  ],
  "Peixe": [
    {name:"Iscas crocantes + batata frita", desc:"Iscas de peixe empanadas e fritas, leves e crocantes.", sizes:{M:33.35,G:39.10}},
    {name:"Filé grelhado + batata frita", desc:"Filé de peixe grelhado, temperado com ervas.", sizes:{M:33.35,G:39.10}},
    {name:"Filé empanado + batata frita", desc:"Filé de peixe empanado com crocância perfeita.", sizes:{M:33.35,G:39.10}},
  ],
  "Almôndegas": [
    {name:"Frango ou Bovino ao molho", desc:"Almôndegas selecionadas preparadas ao molho. Acompanha macarrão e salada.", rangeText:"M R$ 31,05 – 32,20  |  G R$ 37,95", note:"Preço varia conforme a proteína escolhida."},
    {name:"Almôndegas Recheadas", desc:"Almôndegas com recheio especial ao molho. Acompanha macarrão e salada.", rangeText:"M R$ 33,05 – 34,20  |  G R$ 37,95", note:"Preço varia conforme o recheio escolhido."},
  ]
} as const;

export const panquecas = {
  desc:"Massa leve recheada e coberta com molho. Acompanha arroz, salada e batata frita.",
  sabores:"Carne, Frango, Calabresa, Brócolis, Frango c/ Catupiry",
  sizes:{M:31.00,G:37.00}
};

export const parmegianas = {
  desc:"Filés de frango, suíno, bovino ou peixe, empanados, cobertos com molho e queijo gratinado. Acompanha arroz, salada e batata frita.",
  rangeText:"M R$ 37,00 – 41,00  |  G R$ 43,00 – 47,00",
  note:"Preço varia conforme o filé escolhido."
};

export const pratoDoDia = {
  seg:{label:"Segunda-feira", cor:"#F2B705",
    itens:[
      {name:"Picadinho com batata", desc:"Carne bovina picada cozida ao molho com batatas macias.", sizes:{P:26,M:31.20,G:39}},
      {name:"Galinha com batata", desc:"Pedaços de frango cozidos com batatas em molho saboroso.", sizes:{P:26,M:31.20,G:39}},
      {name:"Virado à paulista", desc:"Bisteca suína, ovo frito, banana à milanesa, couve refogada, arroz e feijão.", sizes:{P:26,M:31.20,G:39}},
      {name:"Tilápia", desc:"Filé de tilápia empanado e frito.", sizes:{P:26,M:31.20,G:39}},
    ]},
  ter:{label:"Terça-feira", cor:"#2C6E9E",
    itens:[
      {name:"Bife à rolê", desc:"Bife bovino recheado e cozido lentamente ao molho.", sizes:{P:26,M:31.20,G:39}},
      {name:"Frango à passarinho", desc:"Pedaços de frango temperados e fritos até dourar.", sizes:{P:26,M:31.20,G:39}},
      {name:"Costelinha barbecue", desc:"Costelinha suína assada com molho barbecue.", sizes:{P:26,M:31.20,G:39}},
      {name:"Lombo na cerveja", desc:"Lombo suíno assado lentamente em molho encorpado.", sizes:{P:26,M:31.20,G:39}},
    ]},
  qua:{label:"Quarta-feira", cor:"#4C8C4A",
    itens:[
      {name:"Feijoada", desc:"Feijoada tradicional com carnes selecionadas. Acompanha arroz, farofa, couve e vinagrete.", sizes:{M:39,G:46.80,"Sep. I":104,"Sep. II":156}},
      {name:"Carne assada", desc:"Carne bovina assada lentamente ao molho.", sizes:{P:26,M:31.20,G:39}},
      {name:"Panqueca de carne", desc:"Massa leve recheada com carne moída ao molho.", sizes:{P:26,M:31.20,G:39}},
      {name:"Strogonoff de frango", desc:"Cubos de frango ao molho cremoso. Acompanha arroz, batata palha e salada.", sizes:{P:26,M:31.20,G:39}},
    ]},
  qui:{label:"Quinta-feira", cor:"#E07B21",
    itens:[
      {name:"Costela com mandioca", desc:"Costela bovina cozida lentamente com mandioca.", sizes:{P:26,M:31.20,G:39}},
      {name:"Parmegiana de frango", desc:"Filé empanado com molho e queijo gratinado. Acompanha batata frita.", sizes:{P:26,M:31.20,G:39}},
      {name:"Almôndega recheada", desc:"Almôndega recheada ao molho. Acompanha macarrão, arroz, feijão e salada.", sizes:{P:26,M:31.20,G:39}},
      {name:"Dobradinha", desc:"Preparada com tempero especial.", sizes:{P:26,M:31.20,G:39}},
    ]},
  sex:{label:"Sexta-feira", cor:"#C1440E",
    itens:[
      {name:"Frango assado", desc:"Frango assado dourado e suculento.", sizes:{P:26,M:31.20,G:39}},
      {name:"Peixe ao molho de camarão", desc:"Filé de peixe com molho de camarão.", sizes:{P:26,M:31.20,G:39}},
      {name:"Carne com abóbora", desc:"Carne bovina cozida com abóbora e temperos.", sizes:{P:26,M:31.20,G:39}},
      {name:"Peixe ao molho branco", desc:"Filé de peixe ao molho branco cremoso.", sizes:{P:26,M:31.20,G:39}},
    ]},
  sab:{label:"Sábado", cor:"#7B4B94",
    itens:[
      {name:"Feijoada", desc:"Feijoada tradicional com carnes selecionadas. Acompanha arroz, farofa, couve e vinagrete.", sizes:{M:39,G:46.80,"Sep. I":104,"Sep. II":156}},
      {name:"Lasanha", desc:"Lasanha gratinada com queijo e molho.", sizes:{P:26,M:31.20,G:39}},
      {name:"Frango com bacon", desc:"Medalhão de frango grelhado com bacon.", sizes:{P:26,M:31.20,G:39}},
      {name:"Carne recheada", desc:"Carne bovina recheada e assada ao molho.", sizes:{P:26,M:31.20,G:39}},
    ]},
};

export const sobremesas = [
  {name:"Bolo de pote", sizes:{"Un.":13.00}},
  {name:"Bolo em pedaço", sizes:{"Un.":15.60}},
  {name:"Mousse / Pudim", sizes:{"Un.":13.00}},
];

export const bebidas = {
  "Águas": [
    {name:"Água sem gás", sizes:{"Un.":4.55}},
    {name:"Água com gás", sizes:{"Un.":5.20}},
    {name:"Água tônica", sizes:{"Un.":7.80}},
  ],
  "Energéticos": [
    {name:"Flying", sizes:{"Un.":7.80}},
  ],
  "H2O": [
    {name:"H2O", sizes:{"500ml":9.75,"1,5L":19.50}},
  ],
  "Cervejas": [
    {name:"Amstel", sizes:{"Un.":6.50}},
    {name:"Skol", sizes:{"Un.":7.80}},
    {name:"Eisenbahn", sizes:{"Un.":10.40}},
    {name:"Heineken", sizes:{"330ml garrafa":13.00,"350ml":19.50}},
  ],
  "Refrigerantes": [
    {name:"Refrigerante", sizes:{"350ml":8.45,"600ml":11.70,"1L":12.35,"2L":23.40}},
    {name:"Guaraná 2L", sizes:{"2L":19.50}},
  ],
  "Sucos": [
    {name:"Del Valle", sizes:{"290ml":9.10}},
  ],
};
