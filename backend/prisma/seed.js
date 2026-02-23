require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({});

const surahs = [
  { surah_id: 1, surah_name: 'Al-Fatihah', verse_count: 7 },
  { surah_id: 2, surah_name: 'Al-Baqarah', verse_count: 286 },
  { surah_id: 3, surah_name: 'Al-Imran', verse_count: 200 },
  { surah_id: 4, surah_name: 'An-Nisa', verse_count: 176 },
  { surah_id: 5, surah_name: 'Al-Ma\'idah', verse_count: 120 },
  { surah_id: 6, surah_name: 'Al-An\'am', verse_count: 165 },
  { surah_id: 7, surah_name: 'Al-A\'raf', verse_count: 206 },
  { surah_id: 8, surah_name: 'Al-Anfal', verse_count: 75 },
  { surah_id: 9, surah_name: 'At-Tawbah', verse_count: 129 },
  { surah_id: 10, surah_name: 'Yunus', verse_count: 109 },
  { surah_id: 11, surah_name: 'Hud', verse_count: 123 },
  { surah_id: 12, surah_name: 'Yusuf', verse_count: 111 },
  { surah_id: 13, surah_name: 'Ar-Ra\'d', verse_count: 43 },
  { surah_id: 14, surah_name: 'Ibrahim', verse_count: 52 },
  { surah_id: 15, surah_name: 'Al-Hijr', verse_count: 99 },
  { surah_id: 16, surah_name: 'An-Nahl', verse_count: 128 },
  { surah_id: 17, surah_name: 'Al-Isra', verse_count: 111 },
  { surah_id: 18, surah_name: 'Al-Kahf', verse_count: 110 },
  { surah_id: 19, surah_name: 'Maryam', verse_count: 98 },
  { surah_id: 20, surah_name: 'Ta-Ha', verse_count: 135 },
  { surah_id: 21, surah_name: 'Al-Anbiya', verse_count: 112 },
  { surah_id: 22, surah_name: 'Al-Hajj', verse_count: 78 },
  { surah_id: 23, surah_name: 'Al-Mu\'minun', verse_count: 118 },
  { surah_id: 24, surah_name: 'An-Nur', verse_count: 64 },
  { surah_id: 25, surah_name: 'Al-Furqan', verse_count: 77 },
  { surah_id: 26, surah_name: 'Ash-Shu\'ara', verse_count: 227 },
  { surah_id: 27, surah_name: 'An-Naml', verse_count: 93 },
  { surah_id: 28, surah_name: 'Al-Qasas', verse_count: 88 },
  { surah_id: 29, surah_name: 'Al-Ankabut', verse_count: 69 },
  { surah_id: 30, surah_name: 'Ar-Rum', verse_count: 60 },
  { surah_id: 31, surah_name: 'Luqman', verse_count: 34 },
  { surah_id: 32, surah_name: 'As-Sajdah', verse_count: 30 },
  { surah_id: 33, surah_name: 'Al-Ahzab', verse_count: 73 },
  { surah_id: 34, surah_name: 'Saba', verse_count: 54 },
  { surah_id: 35, surah_name: 'Fatir', verse_count: 45 },
  { surah_id: 36, surah_name: 'Ya-Sin', verse_count: 83 },
  { surah_id: 37, surah_name: 'As-Saffat', verse_count: 182 },
  { surah_id: 38, surah_name: 'Sad', verse_count: 88 },
  { surah_id: 39, surah_name: 'Az-Zumar', verse_count: 75 },
  { surah_id: 40, surah_name: 'Ghafir', verse_count: 85 },
  { surah_id: 41, surah_name: 'Fussilat', verse_count: 54 },
  { surah_id: 42, surah_name: 'Ash-Shura', verse_count: 53 },
  { surah_id: 43, surah_name: 'Az-Zukhruf', verse_count: 89 },
  { surah_id: 44, surah_name: 'Ad-Dukhan', verse_count: 59 },
  { surah_id: 45, surah_name: 'Al-Jathiyah', verse_count: 37 },
  { surah_id: 46, surah_name: 'Al-Ahqaf', verse_count: 35 },
  { surah_id: 47, surah_name: 'Muhammad', verse_count: 38 },
  { surah_id: 48, surah_name: 'Al-Fath', verse_count: 29 },
  { surah_id: 49, surah_name: 'Al-Hujurat', verse_count: 18 },
  { surah_id: 50, surah_name: 'Qaf', verse_count: 45 },
  { surah_id: 51, surah_name: 'Ad-Dhariyat', verse_count: 60 },
  { surah_id: 52, surah_name: 'At-Tur', verse_count: 49 },
  { surah_id: 53, surah_name: 'An-Najm', verse_count: 62 },
  { surah_id: 54, surah_name: 'Al-Qamar', verse_count: 55 },
  { surah_id: 55, surah_name: 'Ar-Rahman', verse_count: 78 },
  { surah_id: 56, surah_name: 'Al-Waqi\'ah', verse_count: 96 },
  { surah_id: 57, surah_name: 'Al-Hadid', verse_count: 29 },
  { surah_id: 58, surah_name: 'Al-Mujadilah', verse_count: 22 },
  { surah_id: 59, surah_name: 'Al-Hashr', verse_count: 24 },
  { surah_id: 60, surah_name: 'Al-Mumtahanah', verse_count: 13 },
  { surah_id: 61, surah_name: 'As-Saff', verse_count: 14 },
  { surah_id: 62, surah_name: 'Al-Jumu\'ah', verse_count: 11 },
  { surah_id: 63, surah_name: 'Al-Munafiqun', verse_count: 11 },
  { surah_id: 64, surah_name: 'At-Taghabun', verse_count: 18 },
  { surah_id: 65, surah_name: 'At-Talaq', verse_count: 12 },
  { surah_id: 66, surah_name: 'At-Tahrim', verse_count: 12 },
  { surah_id: 67, surah_name: 'Al-Mulk', verse_count: 30 },
  { surah_id: 68, surah_name: 'Al-Qalam', verse_count: 52 },
  { surah_id: 69, surah_name: 'Al-Haqqah', verse_count: 52 },
  { surah_id: 70, surah_name: 'Al-Ma\'arij', verse_count: 44 },
  { surah_id: 71, surah_name: 'Nuh', verse_count: 28 },
  { surah_id: 72, surah_name: 'Al-Jinn', verse_count: 28 },
  { surah_id: 73, surah_name: 'Al-Muzzammil', verse_count: 20 },
  { surah_id: 74, surah_name: 'Al-Muddaththir', verse_count: 56 },
  { surah_id: 75, surah_name: 'Al-Qiyamah', verse_count: 40 },
  { surah_id: 76, surah_name: 'Al-Insan', verse_count: 31 },
  { surah_id: 77, surah_name: 'Al-Mursalat', verse_count: 50 },
  { surah_id: 78, surah_name: 'An-Naba', verse_count: 40 },
  { surah_id: 79, surah_name: 'An-Nazi\'at', verse_count: 46 },
  { surah_id: 80, surah_name: 'Abasa', verse_count: 42 },
  { surah_id: 81, surah_name: 'At-Takwir', verse_count: 29 },
  { surah_id: 82, surah_name: 'Al-Infitar', verse_count: 19 },
  { surah_id: 83, surah_name: 'Al-Mutaffifin', verse_count: 36 },
  { surah_id: 84, surah_name: 'Al-Inshiqaq', verse_count: 25 },
  { surah_id: 85, surah_name: 'Al-Buruj', verse_count: 22 },
  { surah_id: 86, surah_name: 'At-Tariq', verse_count: 17 },
  { surah_id: 87, surah_name: 'Al-A\'la', verse_count: 19 },
  { surah_id: 88, surah_name: 'Al-Ghashiyah', verse_count: 26 },
  { surah_id: 89, surah_name: 'Al-Fajr', verse_count: 30 },
  { surah_id: 90, surah_name: 'Al-Balad', verse_count: 20 },
  { surah_id: 91, surah_name: 'Ash-Shams', verse_count: 15 },
  { surah_id: 92, surah_name: 'Al-Lail', verse_count: 21 },
  { surah_id: 93, surah_name: 'Ad-Duha', verse_count: 11 },
  { surah_id: 94, surah_name: 'Ash-Sharh', verse_count: 8 },
  { surah_id: 95, surah_name: 'At-Tin', verse_count: 8 },
  { surah_id: 96, surah_name: 'Al-Alaq', verse_count: 19 },
  { surah_id: 97, surah_name: 'Al-Qadr', verse_count: 5 },
  { surah_id: 98, surah_name: 'Al-Bayyinah', verse_count: 8 },
  { surah_id: 99, surah_name: 'Az-Zalzalah', verse_count: 8 },
  { surah_id: 100, surah_name: 'Al-Adiyat', verse_count: 11 },
  { surah_id: 101, surah_name: 'Al-Qari\'ah', verse_count: 11 },
  { surah_id: 102, surah_name: 'At-Takathur', verse_count: 8 },
  { surah_id: 103, surah_name: 'Al-Asr', verse_count: 3 },
  { surah_id: 104, surah_name: 'Al-Humazah', verse_count: 9 },
  { surah_id: 105, surah_name: 'Al-Fil', verse_count: 5 },
  { surah_id: 106, surah_name: 'Quraish', verse_count: 4 },
  { surah_id: 107, surah_name: 'Al-Ma\'un', verse_count: 7 },
  { surah_id: 108, surah_name: 'Al-Kawthar', verse_count: 3 },
  { surah_id: 109, surah_name: 'Al-Kafirun', verse_count: 6 },
  { surah_id: 110, surah_name: 'An-Nasr', verse_count: 3 },
  { surah_id: 111, surah_name: 'Al-Masad', verse_count: 5 },
  { surah_id: 112, surah_name: 'Al-Ikhlas', verse_count: 4 },
  { surah_id: 113, surah_name: 'Al-Falaq', verse_count: 5 },
  { surah_id: 114, surah_name: 'An-Nas', verse_count: 6 }
];

async function main() {
  console.log('Start seeding Quran metadata...');
  
  for (const surah of surahs) {
    await prisma.quranMetadata.upsert({
      where: { surah_id: surah.surah_id },
      update: {},
      create: surah,
    });
  }
  
  console.log('Seeding finished.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
