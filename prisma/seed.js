import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const ROUNDS = Number(process.env.BCRYPT_ROUNDS || 10);

const hash = (pw) => bcrypt.hash(pw, ROUNDS);

async function reset() {
  // Delete in dependency order
  await prisma.couponUsage.deleteMany();
  await prisma.review.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.user.deleteMany();
}

async function main() {
  await reset();

  // ---- Users ----------------------------------------------------------------
  const [admin, alice, bob] = await Promise.all([
    prisma.user.create({
      data: {
        name: 'Admin',
        email: 'admin@test.com',
        password: await hash('Admin@123'),
        role: 'ADMIN',
        cart: { create: {} },
      },
    }),
    prisma.user.create({
      data: {
        name: 'Alice',
        email: 'alice@test.com',
        password: await hash('Alice@123'),
        role: 'CUSTOMER',
        cart: { create: {} },
      },
    }),
    prisma.user.create({
      data: {
        name: 'Bob',
        email: 'bob@test.com',
        password: await hash('Bob@123'),
        role: 'CUSTOMER',
        cart: { create: {} },
      },
    }),
  ]);

  // ---- Categories -----------------------------------------------------------
  const [electronics, books, clothing, home] = await Promise.all([
    prisma.category.create({
      data: {
        name: 'Eletrônicos',
        slug: 'eletronicos',
        description: 'Gadgets, acessórios e dispositivos para o seu dia a dia',
        imageUrl:
          'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=600&q=80',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Livros',
        slug: 'livros',
        description: 'Best-sellers, clássicos e lançamentos para todos os gostos',
        imageUrl:
          'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=600&q=80',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Vestuário',
        slug: 'vestuario',
        description: 'Roupas, calçados e acessórios para todas as ocasiões',
        imageUrl:
          'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=600&q=80',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Casa & Cozinha',
        slug: 'casa-e-cozinha',
        description:
          'Utensílios, eletroportáteis e peças para deixar sua casa do seu jeito',
        imageUrl:
          'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80',
      },
    }),
  ]);

  // ---- Products -------------------------------------------------------------
  // Imagens vêm do Unsplash (royalty-free, sem necessidade de API key).
  await prisma.product.createMany({
    data: [
      {
        name: 'Fone de Ouvido Bluetooth',
        slug: 'fone-bluetooth',
        description:
          'Fone over-ear sem fio com cancelamento ativo de ruído e até 30 horas de bateria.',
        price: 299.9,
        stock: 25,
        active: true,
        imageUrl:
          'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80',
        categoryId: electronics.id,
      },
      {
        name: 'Teclado Mecânico RGB',
        slug: 'teclado-mecanico-rgb',
        description:
          'Teclado mecânico hot-swappable com switches Brown e iluminação RGB personalizável.',
        price: 449.0,
        stock: 10,
        active: true,
        imageUrl:
          'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&q=80',
        categoryId: electronics.id,
      },
      {
        name: 'Código Limpo',
        slug: 'codigo-limpo',
        description:
          'Manual de boas práticas de programação ágil — o clássico de Robert C. Martin (Uncle Bob) sobre como escrever código sustentável.',
        price: 89.9,
        stock: 50,
        active: true,
        imageUrl:
          'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=600&q=80',
        categoryId: books.id,
      },
      {
        name: 'O Programador Pragmático',
        slug: 'o-programador-pragmatico',
        description:
          'Edição comemorativa do clássico de Andy Hunt e Dave Thomas — um guia atemporal sobre boas práticas de desenvolvimento de software.',
        price: 99.9,
        stock: 0, // sem estoque — útil para casos negativos de QA
        active: true,
        imageUrl:
          'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600&q=80',
        categoryId: books.id,
      },
      {
        name: 'Camiseta Básica Branca',
        slug: 'camiseta-basica-branca',
        description:
          'Camiseta unissex 100% algodão, modelagem regular fit. Macia, durável e perfeita para o dia a dia.',
        price: 59.9,
        stock: 100,
        active: true,
        imageUrl:
          'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600&q=80',
        categoryId: clothing.id,
      },
      {
        name: 'Moletom Vintage (descontinuado)',
        slug: 'moletom-vintage-descontinuado',
        description:
          'Moletom de algodão estilo vintage — peça descontinuada, mantida no catálogo apenas para fins de teste.',
        price: 79.9,
        stock: 5,
        active: false, // inativo — útil para casos negativos de QA
        imageUrl:
          'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600&q=80',
        categoryId: clothing.id,
      },
      // ---- Casa & Cozinha ---------------------------------------------------
      {
        name: 'Cafeteira Italiana 6 Xícaras',
        slug: 'cafeteira-italiana-6-xicaras',
        description:
          'Moka pot em alumínio polido para preparar café espresso direto no fogão. Capacidade de 6 xícaras (300 ml).',
        price: 159.0,
        stock: 30,
        active: true,
        imageUrl:
          'https://images.unsplash.com/photo-1576336171759-1ea1d888a784?w=600&q=80',
        categoryId: home.id,
      },
      {
        name: 'Conjunto de Panelas Antiaderente (5 peças)',
        slug: 'conjunto-panelas-antiaderente-5-pecas',
        description:
          'Jogo de 5 panelas com revestimento antiaderente, cabos ergonômicos resistentes ao calor e tampas de vidro temperado.',
        price: 449.0,
        stock: 12,
        active: true,
        imageUrl:
          'https://images.unsplash.com/photo-1573821663912-6df460f9c684?w=600&q=80',
        categoryId: home.id,
      },
      {
        name: 'Liquidificador 3L 1200W',
        slug: 'liquidificador-3l-1200w',
        description:
          'Liquidificador de alta potência (1200 W) com jarra de vidro de 3 litros, 12 velocidades e função pulsar.',
        price: 219.9,
        stock: 8,
        active: true,
        imageUrl:
          'https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=600&q=80',
        categoryId: home.id,
      },
      {
        name: 'Jogo de Pratos de Porcelana (6 peças)',
        slug: 'jogo-pratos-porcelana-6-pecas',
        description:
          'Aparelho de jantar em porcelana branca com 6 pratos rasos. Pode ir ao micro-ondas e à lava-louças.',
        price: 189.0,
        stock: 25,
        active: true,
        imageUrl:
          'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=600&q=80',
        categoryId: home.id,
      },
      {
        name: 'Garrafa Térmica Aço Inox 1L',
        slug: 'garrafa-termica-aco-inox-1l',
        description:
          'Garrafa térmica em aço inox 304 com parede dupla a vácuo. Mantém a temperatura por até 24 horas (frio) ou 12 horas (quente).',
        price: 89.9,
        stock: 50,
        active: true,
        imageUrl:
          'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600&q=80',
        categoryId: home.id,
      },
      // ---- Eletrônicos (extras) ---------------------------------------------
      {
        name: 'Mouse Sem Fio Ergonômico',
        slug: 'mouse-sem-fio-ergonomico',
        description:
          'Mouse vertical sem fio com sensor de 2400 DPI, 6 botões programáveis e bateria recarregável via USB-C.',
        price: 129.9,
        stock: 40,
        active: true,
        imageUrl:
          'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600&q=80',
        categoryId: electronics.id,
      },
      {
        name: 'Monitor 24" Full HD IPS',
        slug: 'monitor-24-full-hd-ips',
        description:
          'Monitor IPS de 24 polegadas com resolução 1920×1080, 75 Hz, bordas finas e suporte VESA.',
        price: 899.0,
        stock: 15,
        active: true,
        imageUrl:
          'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600&q=80',
        categoryId: electronics.id,
      },
      {
        name: 'Webcam Full HD 1080p',
        slug: 'webcam-full-hd-1080p',
        description:
          'Webcam com microfone embutido, autofoco e correção automática de luz para videoconferências.',
        price: 199.9,
        stock: 22,
        active: true,
        imageUrl:
          'https://images.unsplash.com/photo-1598257006458-087169a1f08d?w=600&q=80',
        categoryId: electronics.id,
      },
      {
        name: 'SSD NVMe 1TB',
        slug: 'ssd-nvme-1tb',
        description:
          'Unidade de estado sólido NVMe M.2 de 1 TB com leitura sequencial de até 3500 MB/s.',
        price: 349.9,
        stock: 18,
        active: true,
        imageUrl:
          'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=600&q=80',
        categoryId: electronics.id,
      },
      {
        name: 'Hub USB-C 7 em 1',
        slug: 'hub-usb-c-7-em-1',
        description:
          'Adaptador USB-C com HDMI 4K, 3 portas USB-A, leitor SD/microSD e entrega de energia de 100 W.',
        price: 179.9,
        stock: 35,
        active: true,
        imageUrl:
          'https://images.unsplash.com/photo-1625948515291-69613efd103f?w=600&q=80',
        categoryId: electronics.id,
      },
      // ---- Livros (extras) --------------------------------------------------
      {
        name: 'Domain-Driven Design',
        slug: 'domain-driven-design',
        description:
          'Abordagem de Eric Evans para modelar software complexo alinhado ao domínio do negócio.',
        price: 119.9,
        stock: 20,
        active: true,
        imageUrl:
          'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=600&q=80',
        categoryId: books.id,
      },
      {
        name: 'Refatoração',
        slug: 'refatoracao-martin-fowler',
        description:
          'Catálogo de técnicas para melhorar o design de código existente sem alterar comportamento.',
        price: 109.9,
        stock: 15,
        active: true,
        imageUrl:
          'https://images.unsplash.com/photo-1519682337058-a94d519337bc?w=600&q=80',
        categoryId: books.id,
      },
      {
        name: 'Introdução a Algoritmos',
        slug: 'introducao-a-algoritmos',
        description:
          'Referência clássica (CLRS) sobre estruturas de dados, complexidade e algoritmos fundamentais.',
        price: 249.9,
        stock: 8,
        active: true,
        imageUrl:
          'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&q=80',
        categoryId: books.id,
      },
      // ---- Vestuário (extras) -------------------------------------------------
      {
        name: 'Calça Jeans Slim',
        slug: 'calca-jeans-slim',
        description:
          'Jeans masculino corte slim com elastano para conforto. Lavagem média e cós médio.',
        price: 129.9,
        stock: 60,
        active: true,
        imageUrl:
          'https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&q=80',
        categoryId: clothing.id,
      },
      {
        name: 'Tênis Casual Branco',
        slug: 'tenis-casual-branco',
        description:
          'Tênis unissex em couro sintético, solado em borracha antiderrapante e palmilha acolchoada.',
        price: 199.9,
        stock: 45,
        active: true,
        imageUrl:
          'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600&q=80',
        categoryId: clothing.id,
      },
      {
        name: 'Boné Aba Curva',
        slug: 'bone-aba-curva',
        description:
          'Boné ajustável em algodão com aba curva e fecho snapback. Disponível em cores neutras.',
        price: 49.9,
        stock: 80,
        active: true,
        imageUrl:
          'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=600&q=80',
        categoryId: clothing.id,
      },
      // ---- Casa & Cozinha (extras) ------------------------------------------
      {
        name: 'Air Fryer 4L Digital',
        slug: 'air-fryer-4l-digital',
        description:
          'Fritadeira sem óleo com painel digital, 8 programas pré-definidos e cesto antiaderente removível.',
        price: 329.9,
        stock: 20,
        active: true,
        imageUrl:
          'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=600&q=80',
        categoryId: home.id,
      },
      {
        name: 'Jogo de Facas Inox (6 peças)',
        slug: 'jogo-facas-inox-6-pecas',
        description:
          'Conjunto com 5 facas em aço inox e suporte de madeira. Inclui faca do chef, santoku e descascador.',
        price: 159.9,
        stock: 28,
        active: true,
        imageUrl:
          'https://images.unsplash.com/photo-1590165482129-1b8b27698780?w=600&q=80',
        categoryId: home.id,
      },
      {
        name: 'Jogo de Toalhas de Banho (4 peças)',
        slug: 'jogo-toalhas-banho-4-pecas',
        description:
          'Kit com 2 toalhas de banho e 2 de rosto em algodão 450 g/m². Macias e de secagem rápida.',
        price: 119.9,
        stock: 40,
        active: true,
        imageUrl:
          'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=600&q=80',
        categoryId: home.id,
      },
    ],
  });

  const productCount = await prisma.product.count();
  const activeCount = await prisma.product.count({ where: { active: true } });
  const outOfStockCount = await prisma.product.count({
    where: { active: true, stock: 0 },
  });
  const inactiveCount = await prisma.product.count({ where: { active: false } });

  // ---- Coupons --------------------------------------------------------------
  const now = new Date();
  const oneYearLater = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
  const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  await prisma.coupon.createMany({
    data: [
      {
        code: 'WELCOME10',
        type: 'PERCENTAGE',
        value: 10,
        minOrderValue: 0,
        maxDiscount: null,
        usageLimit: null,
        perUserLimit: 1,
        validFrom: oneMonthAgo,
        validUntil: oneYearLater,
        active: true,
      },
      {
        code: 'BLACKFRIDAY',
        type: 'FIXED',
        value: 50,
        minOrderValue: 200,
        maxDiscount: null,
        usageLimit: 100,
        perUserLimit: 1,
        validFrom: oneMonthAgo,
        validUntil: oneYearLater,
        active: true,
      },
      {
        code: 'EXPIRED',
        type: 'PERCENTAGE',
        value: 5,
        minOrderValue: 0,
        maxDiscount: null,
        usageLimit: null,
        perUserLimit: 1,
        validFrom: oneYearAgo,
        validUntil: oneMonthAgo,
        active: true,
      },
    ],
  });

  process.stdout.write(
    `Seed finished:\n` +
      `  users      : ${[admin.email, alice.email, bob.email].join(', ')}\n` +
      `  categories : Eletrônicos, Livros, Vestuário, Casa & Cozinha\n` +
      `  products   : ${productCount} (${activeCount} ativos, ${inactiveCount} inativo, ${outOfStockCount} sem estoque)\n` +
      `  coupons    : WELCOME10, BLACKFRIDAY, EXPIRED\n`
  );
}

main()
  .catch((err) => {
    process.stderr.write(`Seed failed: ${err?.stack || err?.message || err}\n`);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
