// =========================================================================
// Educational Data Engine & Synchronization (UPDATED)
// Manages: 
// 1. Grades (KG to 12) & Student Chosen Grades Filter
// 2. Comprehensive Curriculum Subjects (Chemistry, Physics, Biology, Math, etc.)
// 3. Multi-Format Malzama Uploads & Viewing (PowerPoint, HTML, Image, PDF)
// 4. Strict Language-Based Filtering (Badini, Sorani, Arabic, English)
// 5. Teachers Registry sorted by Views & Admin Approval Workflow
// =========================================================================

const SUPER_ADMIN_EMAIL = "hussein.zebary.chemistry96@gmail.com";

const GRADES_CONFIG = [
    { id: 'kg', name: 'باخچەی ساوایان', shortName: 'باخچە', level: 'kindergarten', icon: 'fa-shapes', color: '#ff7b54' },
    { id: '1', name: 'پۆلا ١ (ئێکێ)', shortName: 'پۆلا ١', level: 'primary', icon: 'fa-child', color: '#4d96ff' },
    { id: '2', name: 'پۆلا ٢ (دووێ)', shortName: 'پۆلا ٢', level: 'primary', icon: 'fa-pencil-alt', color: '#6bc670' },
    { id: '3', name: 'پۆلا ٣ (سێیێ)', shortName: 'پۆلا ٣', level: 'primary', icon: 'fa-book-reader', color: '#ffb26b' },
    { id: '4', name: 'پۆلا ٤ (چارێ)', shortName: 'پۆلا ٤', level: 'primary', icon: 'fa-lightbulb', color: '#9d4edd' },
    { id: '5', name: 'پۆلا ٥ (پێنجێ)', shortName: 'پۆلا ٥', level: 'primary', icon: 'fa-atom', color: '#00b4d8' },
    { id: '6', name: 'پۆلا ٦ (شەشێ)', shortName: 'پۆلا ٦', level: 'primary', icon: 'fa-calculator', color: '#e76f51' },
    { id: '7', name: 'پۆلا ٧ (حەفتێ)', shortName: 'پۆلا ٧', level: 'middle', icon: 'fa-compass', color: '#2a9d8f' },
    { id: '8', name: 'پۆلا ٨ (هەشتێ)', shortName: 'پۆلا ٨', level: 'middle', icon: 'fa-microscope', color: '#e63946' },
    { id: '9', name: 'پۆلا ٩ (نەهێ)', shortName: 'پۆلا ٩', level: 'middle', icon: 'fa-graduation-cap', color: '#457b9d' },
    { id: '10', name: 'پۆلا ١٠ (دەهێ)', shortName: 'پۆلا ١٠', level: 'high', icon: 'fa-school', color: '#8A2BE2' },
    { id: '11', name: 'پۆلا ١١ (یازدێ)', shortName: 'پۆلا ١١', level: 'high', icon: 'fa-flask', color: '#007BFF' },
    { id: '12', name: 'پۆلا ١٢ (دوازدێ)', shortName: 'پۆلا ١٢', level: 'high', icon: 'fa-award', color: '#28a745' }
];

// Language configurations mapping
const SUPPORTED_LANGS = {
    ku_ba: { id: 'ku_ba', name: 'باهدینی', flag: 'badge-ba' },
    ku_so: { id: 'ku_so', name: 'سۆرانی', flag: 'badge-so' },
    ar: { id: 'ar', name: 'عەرەبی', flag: 'badge-ar' },
    en: { id: 'en', name: 'ئینگلیزی', flag: 'badge-en' }
};

// =========================================================================
// CURRICULUM SUBJECTS (وەک کیمیا، فیزیا، زیندەوەر، بیرکاری، عەرەبی، کوردی، ئاین، ئینگلێزی، کۆمپیوتەر)
// =========================================================================
const CURRICULUM_SUBJECTS = [
    {
        id: 'chem',
        name: 'کیمیا',
        nameEn: 'Chemistry',
        nameAr: 'الكيمياء',
        icon: 'fa-flask',
        color: '#00b4d8',
        gradient: 'linear-gradient(135deg, #0077b6, #00b4d8)',
        keywords: ['کیمیا', 'chemistry', 'كيمياء', 'کیمیا (chemistry)', 'chem'],
        grades: ['7', '8', '9', '10', '11', '12']
    },
    {
        id: 'phys',
        name: 'فیزیا',
        nameEn: 'Physics',
        nameAr: 'الفيزياء',
        icon: 'fa-atom',
        color: '#7209b7',
        gradient: 'linear-gradient(135deg, #560bad, #b5179e)',
        keywords: ['فیزیا', 'physics', 'فيزياء', 'فیزیا (physics)', 'phys'],
        grades: ['7', '8', '9', '10', '11', '12']
    },
    {
        id: 'bio',
        name: 'زیندەوەر',
        nameEn: 'Biology',
        nameAr: 'الأحياء',
        icon: 'fa-dna',
        color: '#2a9d8f',
        gradient: 'linear-gradient(135deg, #264653, #2a9d8f)',
        keywords: ['زیندەوەر', 'زیندەوەرزانی', 'biology', 'أحياء', 'احياء', 'bio'],
        grades: ['7', '8', '9', '10', '11', '12']
    },
    {
        id: 'math',
        name: 'بیرکاری',
        nameEn: 'Mathematics',
        nameAr: 'الرياضيات',
        icon: 'fa-calculator',
        color: '#f77f00',
        gradient: 'linear-gradient(135deg, #d62828, #f77f00)',
        keywords: ['بیرکاری', 'mathematics', 'math', 'رياضيات', 'بيركاري'],
        grades: ['kg', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']
    },
    {
        id: 'ar',
        name: 'عەرەبی',
        nameEn: 'Arabic Language',
        nameAr: 'اللغة العربية',
        icon: 'fa-book-open',
        color: '#023e8a',
        gradient: 'linear-gradient(135deg, #03045e, #0077b6)',
        keywords: ['عەرەبی', 'عربی', 'arabic', 'عربية', 'اللغة العربية'],
        grades: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']
    },
    {
        id: 'ku',
        name: 'کوردی',
        nameEn: 'Kurdish Language',
        nameAr: 'اللغة الكردية',
        icon: 'fa-feather-alt',
        color: '#e63946',
        gradient: 'linear-gradient(135deg, #b5179e, #e63946)',
        keywords: ['کوردی', 'زمانی کوردی', 'kurdish', 'کوردی (kurdish)', 'الكردية'],
        grades: ['kg', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']
    },
    {
        id: 'islam',
        name: 'ئاین',
        nameEn: 'Islamic Education',
        nameAr: 'التربية الإسلامية',
        icon: 'fa-quran',
        color: '#1b4332',
        gradient: 'linear-gradient(135deg, #2d6a4f, #52b788)',
        keywords: ['ئاین', 'ئیسلامی', 'پەروەردەی ئیسلامی', 'islamic', 'دين', 'التربية الإسلامية', 'اسلامی'],
        grades: ['kg', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']
    },
    {
        id: 'en',
        name: 'ئینگلێزی',
        nameEn: 'English Language',
        nameAr: 'اللغة الإنجليزية',
        icon: 'fa-globe',
        color: '#4361ee',
        gradient: 'linear-gradient(135deg, #3f37c9, #4895ef)',
        keywords: ['ئینگلێزی', 'ئینگلیزی', 'english', 'english sunrise', 'إنجليزية', 'انجليزية'],
        grades: ['kg', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']
    },
    {
        id: 'comp',
        name: 'کۆمپیوتەر',
        nameEn: 'Computer Science',
        nameAr: 'الحاسوب والبرمجة',
        icon: 'fa-laptop-code',
        color: '#3a0ca3',
        gradient: 'linear-gradient(135deg, #3a0ca3, #4cc9f0)',
        keywords: ['کۆمپیوتەر', 'کومپیوتەر', 'computer', 'حاسوب', 'it', 'تەکنەلۆژیا', 'برمجة'],
        grades: ['7', '8', '9', '10', '11', '12']
    },
    {
        id: 'sci',
        name: 'زانست',
        nameEn: 'General Science',
        nameAr: 'العلوم العامة',
        icon: 'fa-microscope',
        color: '#38b000',
        gradient: 'linear-gradient(135deg, #007200, #70e000)',
        keywords: ['زانست', 'science', 'علوم', 'العلوم العامة'],
        grades: ['kg', '1', '2', '3', '4', '5', '6', '7', '8', '9']
    },
    {
        id: 'social',
        name: 'کۆمەڵایەتی',
        nameEn: 'Social Studies',
        nameAr: 'الاجتماعيات',
        icon: 'fa-landmark',
        color: '#bc6c25',
        gradient: 'linear-gradient(135deg, #dda15e, #bc6c25)',
        keywords: ['کۆمەڵایەتی', 'مێژوو', 'جوگرافیا', 'social', 'اجتماعيات', 'تاريخ', 'جغرافيا'],
        grades: ['4', '5', '6', '7', '8', '9', '10', '11', '12']
    }
];

// Initial pre-seeded teachers categorized by language & subjects
const DEFAULT_TEACHERS = [
    // --- BAHDINI TEACHERS (ku_ba) ---
    {
        id: 't_hussein',
        name: 'م. حسێن ئەکرەم زێباری',
        subject: 'کیمیا (Chemistry)',
        email: 'Hussein.zebary.chemistry96@gmail.com',
        phone: '0750 000 0000',
        bio: 'مامۆستایێ شارەزا یێ بابەتا کیمیایێ بۆ قۆناغێن ئامادەیی و بنەڕەتی ب شێوەزاری باهدینی',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
        viewsCount: 4250,
        grades: ['10', '11', '12', '9'],
        lang: 'ku_ba',
        status: 'approved',
        createdAt: 1700000000000
    },
    {
        id: 't_sidad',
        name: 'م. سياد عبدالقادر',
        subject: 'کیمیا (Chemistry)',
        email: 'sidad.chemistry@gmail.com',
        phone: '0750 111 2233',
        bio: 'مامۆستایێ بابەتا کیمیایێ بۆ پۆلێن ١٠، ١١، ١٢ ب زمانی کوردی (باهدینی)',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
        viewsCount: 3510,
        grades: ['10', '11', '12'],
        lang: 'ku_ba',
        status: 'approved',
        createdAt: 1700000001000
    },
    {
        id: 't_dilshad',
        name: 'م. دلشاد احمد بارزانی',
        subject: 'بیرکاری (Mathematics)',
        email: 'dilshad.math@gmail.com',
        phone: '0750 333 4455',
        bio: 'مامۆستایێ بیرکاریێ بۆ قۆناغا ئامادەیی و بنەڕەتی ب شێوەزاری باهدینی',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
        viewsCount: 2840,
        grades: ['7', '8', '9', '10', '11', '12'],
        lang: 'ku_ba',
        status: 'approved',
        createdAt: 1700000002000
    },
    {
        id: 't_newzad_phys',
        name: 'م. نەوزاد بێکەس دهۆکی',
        subject: 'فیزیا (Physics)',
        email: 'newzad.physics@gmail.com',
        phone: '0750 222 9988',
        bio: 'مامۆستایێ فیزیا بۆ پۆلێن ئامادەیی، ڕوونکردنەوەیا یاسایێن جوولە و کارەبا ب باهدینی',
        avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&q=80',
        viewsCount: 3100,
        grades: ['10', '11', '12', '9'],
        lang: 'ku_ba',
        status: 'approved',
        createdAt: 1700000002100
    },
    {
        id: 't_dilvin_bio',
        name: 'م. دڵڤین شێروانی',
        subject: 'زیندەوەر (Biology)',
        email: 'dilvin.biology@gmail.com',
        phone: '0750 444 1122',
        bio: 'مامۆستایا زیندەوەرزانی و زانست بۆ پۆلێن ئامادەیی ب شێوازەکێ ئەکادیمی',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80',
        viewsCount: 2950,
        grades: ['10', '11', '12', '9', '8'],
        lang: 'ku_ba',
        status: 'approved',
        createdAt: 1700000002200
    },
    {
        id: 't_rebwar_ku',
        name: 'م. ڕێبوار ئامێدی',
        subject: 'کوردی (Kurdish)',
        email: 'rebwar.kurdish@gmail.com',
        phone: '0750 777 3344',
        bio: 'مامۆستایێ ئەدەب و ڕێزمانی کوردی بۆ پۆلێن ١٠، ١١، ١٢',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=300&q=80',
        viewsCount: 2750,
        grades: ['10', '11', '12', '9'],
        lang: 'ku_ba',
        status: 'approved',
        createdAt: 1700000002300
    },
    {
        id: 't_salah_ar',
        name: 'م. سەڵاحەدین دهۆکی',
        subject: 'عەرەبی (Arabic)',
        email: 'salah.arabic@gmail.com',
        phone: '0750 888 5566',
        bio: 'مامۆستایێ زمانی عەرەبی (قواعد، نصوص، بلاغة) بۆ پۆلێن ئامادەیی',
        avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=300&q=80',
        viewsCount: 2600,
        grades: ['10', '11', '12', '9'],
        lang: 'ku_ba',
        status: 'approved',
        createdAt: 1700000002400
    },
    {
        id: 't_mala_ahmad',
        name: 'مامۆستا مەلا ئەحمەد زێباری',
        subject: 'ئاین (Islamic Education)',
        email: 'mala.ahmad@gmail.com',
        phone: '0750 999 1100',
        bio: 'مامۆستایێ پەروەردەیا ئیسلامی و تەفسیر و ئەحکام بۆ قۆناغێن خواندنێ',
        avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=300&q=80',
        viewsCount: 2480,
        grades: ['10', '11', '12', '9', '8', '7'],
        lang: 'ku_ba',
        status: 'approved',
        createdAt: 1700000002500
    },
    {
        id: 't_rebin_comp',
        name: 'م. ڕێبین ئاکرەیی',
        subject: 'کۆمپیوتەر (Computer Science)',
        email: 'rebin.computer@gmail.com',
        phone: '0750 555 4433',
        bio: 'مامۆستایێ کۆمپیوتەر و زانستی تەکنەلۆژیا بۆ قوتابیێن پۆلێن ٧ تا ١٢',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80',
        viewsCount: 2310,
        grades: ['10', '11', '12', '9', '8', '7'],
        lang: 'ku_ba',
        status: 'approved',
        createdAt: 1700000002600
    },
    {
        id: 't_hevi_ba',
        name: 'م. هێڤی زاخۆیی (English Sunrise)',
        subject: 'ئینگلێزی (English Language)',
        email: 'hevi.english@gmail.com',
        phone: '0750 444 5566',
        bio: 'ڕێزمانی ئینگلیزی و پرۆگرامی Sunrise بۆ پۆلێن ئامادەیی و بنەڕەتی',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80',
        viewsCount: 3950,
        grades: ['kg', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
        lang: 'ku_ba',
        status: 'approved',
        createdAt: 1700000002700
    },
    {
        id: 't_kawa_social',
        name: 'م. کاوە زێباری',
        subject: 'کۆمەڵایەتی (Social Studies)',
        email: 'kawa.social@gmail.com',
        phone: '0750 678 1234',
        bio: 'مامۆستایێ مێژوو و جوگرافیا و کۆمەڵایەتی بۆ قۆناغێن بنەڕەتی و ئامادەیی ب باهدینی',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
        viewsCount: 2210,
        grades: ['4', '5', '6', '7', '8', '9', '10', '11', '12'],
        lang: 'ku_ba',
        status: 'approved',
        createdAt: 1700000002800
    },

    // --- SORANI TEACHERS (ku_so) ---
    {
        id: 't_aras',
        name: 'م. ئاراس کەرکووکی',
        subject: 'فیزیا (Physics)',
        email: 'aras.physics@gmail.com',
        phone: '0750 555 6677',
        bio: 'مامۆستای فیزیای پۆلەکانی ١٠، ١١، ١٢ بە شێوەزاری سۆرانی پاراو',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=300&q=80',
        viewsCount: 3890,
        grades: ['10', '11', '12', '9'],
        lang: 'ku_so',
        status: 'approved',
        createdAt: 1700000004000
    },
    {
        id: 't_karwan',
        name: 'م. کاروان سلێمانی',
        subject: 'کیمیا (Chemistry)',
        email: 'karwan.chem@gmail.com',
        phone: '0770 123 4567',
        bio: 'مامۆستای کیمیای پۆلی ١٢ ی ئامادەیی و شیکاری پرسیارە وزارییەکان بە سۆرانی',
        avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=300&q=80',
        viewsCount: 3120,
        grades: ['10', '11', '12'],
        lang: 'ku_so',
        status: 'approved',
        createdAt: 1700000005000
    },
    {
        id: 't_sozan',
        name: 'م. سۆزان مەحمود',
        subject: 'زیندەوەر (Biology)',
        email: 'sozan.bio@gmail.com',
        phone: '0750 666 7788',
        bio: 'مامۆستای زیندەوەرزانی و زانست بۆ پۆلەکانی بنەڕەتی و ئامادەیی بە سۆرانی',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80',
        viewsCount: 2680,
        grades: ['5', '6', '7', '8', '9', '10', '11', '12'],
        lang: 'ku_so',
        status: 'approved',
        createdAt: 1700000006000
    },
    {
        id: 't_bryar_math',
        name: 'م. بڕیار عەلی چەمچەماڵی',
        subject: 'بیرکاری (Mathematics)',
        email: 'bryar.math@gmail.com',
        phone: '0770 555 1122',
        bio: 'مامۆستای بیرکاری پۆلی ١٢ ی زانستی و وێژەیی بە شێوازی سەردەمیانە',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
        viewsCount: 2980,
        grades: ['10', '11', '12', '9'],
        lang: 'ku_so',
        status: 'approved',
        createdAt: 1700000006100
    },
    {
        id: 't_pakhshan_ku',
        name: 'م. پەخشان شێخانی',
        subject: 'کوردی (Kurdish)',
        email: 'pakhshan.kurdish@gmail.com',
        phone: '0750 333 8899',
        bio: 'مامۆستای زمانی کوردی و ئەدەبیاتی کوردی پۆلەکانی دواناوەندی بە سۆرانی',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80',
        viewsCount: 2450,
        grades: ['10', '11', '12'],
        lang: 'ku_so',
        status: 'approved',
        createdAt: 1700000006200
    },
    {
        id: 't_shaho_comp',
        name: 'م. شاهۆ ئەحمەد هەڵەبجەیی',
        subject: 'کۆمپیوتەر (Computer Science)',
        email: 'shaho.comp@gmail.com',
        phone: '0770 999 4433',
        bio: 'مامۆستای زانستی کۆمپیوتەر و پڕۆگرامسازی بۆ پۆلەکانی ٧ بۆ ١٢ بە سۆرانی',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80',
        viewsCount: 2120,
        grades: ['10', '11', '12', '9'],
        lang: 'ku_so',
        status: 'approved',
        createdAt: 1700000006300
    },
    {
        id: 't_ahmad_islam',
        name: 'م. مەلا کامەران سلێمانی',
        subject: 'ئاین (Islamic Education)',
        email: 'kameran.islam@gmail.com',
        phone: '0770 333 8811',
        bio: 'مامۆستای پەروەردەی ئیسلامی و تەفسیری قورئان بە زمانی کوردی سۆرانی',
        avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=300&q=80',
        viewsCount: 2350,
        grades: ['10', '11', '12', '9'],
        lang: 'ku_so',
        status: 'approved',
        createdAt: 1700000006400
    },
    {
        id: 't_rebaz_social',
        name: 'م. ڕێباز گەرمیانی',
        subject: 'کۆمەڵایەتی (Social Studies)',
        email: 'rebaz.social@gmail.com',
        phone: '0770 444 9900',
        bio: 'مامۆستای کۆمەڵایەتی، مێژوو و جوگرافیای کوردستان و جیهان بە سۆرانی',
        avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&q=80',
        viewsCount: 2190,
        grades: ['7', '8', '9', '10', '11', '12'],
        lang: 'ku_so',
        status: 'approved',
        createdAt: 1700000006500
    },
    {
        id: 't_tara_en',
        name: 'م. تارا عەزیز',
        subject: 'ئینگلێزی (English Language)',
        email: 'tara.english@gmail.com',
        phone: '0770 666 2233',
        bio: 'مامۆستای زمانی ئینگلیزی پرۆگرامی Sunrise بە شێوازی تێگەیشتنی خێرا',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
        viewsCount: 2840,
        grades: ['kg', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
        lang: 'ku_so',
        status: 'approved',
        createdAt: 1700000006600
    },
    {
        id: 't_dara_ar',
        name: 'م. دارا مەحوی',
        subject: 'عەرەبی (Arabic)',
        email: 'dara.arabic@gmail.com',
        phone: '0770 888 1122',
        bio: 'مامۆستای زمانی عەرەبی (قواعد و ڕێزمان و خوێندنەوە) بۆ قۆناغی دواناوەندی',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
        viewsCount: 2510,
        grades: ['10', '11', '12', '9'],
        lang: 'ku_so',
        status: 'approved',
        createdAt: 1700000006700
    },

    // --- ARABIC TEACHERS (ar) ---
    {
        id: 't_ahmed',
        name: 'د. أحمد خالد العبيدي',
        subject: 'الكيمياء (Chemistry)',
        email: 'ahmed.chem.ar@gmail.com',
        phone: '0770 987 6543',
        bio: 'مدرس مادة الكيمياء للمراحل الثانوية والإعدادية باللغة العربية مع حلول الأسئلة الوزارية',
        avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&q=80',
        viewsCount: 3340,
        grades: ['10', '11', '12', '9'],
        lang: 'ar',
        status: 'approved',
        createdAt: 1700000007000
    },
    {
        id: 't_omar',
        name: 'أ. عمر فاضل السامرائي',
        subject: 'الفيزياء (Physics)',
        email: 'omar.math.ar@gmail.com',
        phone: '0780 112 2334',
        bio: 'شروحات مبسطة لمنهاج الفيزياء للمراحل الإعدادية والثانوية باللغة العربية',
        avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=300&q=80',
        viewsCount: 2540,
        grades: ['7', '8', '9', '10', '11', '12'],
        lang: 'ar',
        status: 'approved',
        createdAt: 1700000008000
    },
    {
        id: 't_tariq_math',
        name: 'أ. طارق التميمي',
        subject: 'الرياضيات (Mathematics)',
        email: 'tariq.math@gmail.com',
        phone: '0780 334 5566',
        bio: 'مدرس الرياضيات المتقدمة للصف الثاني عشر والشهادة الوزارية',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
        viewsCount: 2890,
        grades: ['10', '11', '12', '9'],
        lang: 'ar',
        status: 'approved',
        createdAt: 1700000008100
    },
    {
        id: 't_marwan_bio',
        name: 'أ. مروان الحديثي',
        subject: 'الأحياء (Biology)',
        email: 'marwan.bio@gmail.com',
        phone: '0770 445 6677',
        bio: 'مدرس علم الأحياء والوراثة للمرحلة الإعدادية والوزارية',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
        viewsCount: 2620,
        grades: ['10', '11', '12'],
        lang: 'ar',
        status: 'approved',
        createdAt: 1700000008200
    },
    {
        id: 't_haider_comp',
        name: 'أ. حيدر التقني',
        subject: 'الحاسوب والبرمجة (Computer)',
        email: 'haider.comp@gmail.com',
        phone: '0780 778 9900',
        bio: 'مدرس مادة الحاسوب ونظم المعلومات والبرمجة باللغة العربية',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80',
        viewsCount: 2190,
        grades: ['10', '11', '12', '9'],
        lang: 'ar',
        status: 'approved',
        createdAt: 1700000008300
    },
    {
        id: 't_zeid_islam',
        name: 'الشيخ زيد الدليمي',
        subject: 'التربية الإسلامية (Islamic)',
        email: 'zeid.islam@gmail.com',
        phone: '0780 223 3445',
        bio: 'مدرس التربية الإسلامية وأحكام التلاوة للمرحلة المتوسطة والإعدادية',
        avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=300&q=80',
        viewsCount: 2410,
        grades: ['7', '8', '9', '10', '11', '12'],
        lang: 'ar',
        status: 'approved',
        createdAt: 1700000008400
    },
    {
        id: 't_samira_en',
        name: 'أ. سميرة البغدادي',
        subject: 'اللغة الإنجليزية (English)',
        email: 'samira.english@gmail.com',
        phone: '0770 119 8877',
        bio: 'مدرسة اللغة الإنجليزية وقواعد اللغة للمراحل الوزارية',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80',
        viewsCount: 2780,
        grades: ['10', '11', '12'],
        lang: 'ar',
        status: 'approved',
        createdAt: 1700000008500
    },
    {
        id: 't_falah_social',
        name: 'أ. فلاح الشمري',
        subject: 'الاجتماعيات (Social Studies)',
        email: 'falah.social@gmail.com',
        phone: '0780 998 7766',
        bio: 'مدرس مواد التاريخ والجغرافيا والتربية الوطنية باللغة العربية',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=300&q=80',
        viewsCount: 2130,
        grades: ['4', '5', '6', '7', '8', '9', '10', '11', '12'],
        lang: 'ar',
        status: 'approved',
        createdAt: 1700000008600
    },

    // --- ENGLISH TEACHERS (en) ---
    {
        id: 't_hevi',
        name: 'م. هێڤی زاخۆیی (English Sunrise)',
        subject: 'English Language',
        email: 'hevi.english@gmail.com',
        phone: '0750 444 5566',
        bio: 'English Sunrise curriculum instructor for all primary and secondary grades in English',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80',
        viewsCount: 3950,
        grades: ['kg', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
        lang: 'en',
        status: 'approved',
        createdAt: 1700000003000
    },
    {
        id: 't_david',
        name: 'Mr. David Miller',
        subject: 'Chemistry',
        email: 'david.science@gmail.com',
        phone: '0750 999 8877',
        bio: 'Certified International Science & Chemistry Teacher for High School Curriculum in English',
        avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=300&q=80',
        viewsCount: 2280,
        grades: ['10', '11', '12', '9'],
        lang: 'en',
        status: 'approved',
        createdAt: 1700000009000
    },
    {
        id: 't_john_phys',
        name: 'Mr. John Edwards',
        subject: 'Physics',
        email: 'john.physics@gmail.com',
        phone: '0750 123 7890',
        bio: 'Senior Physics educator covering mechanics, electromagnetism and modern physics in English',
        avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=300&q=80',
        viewsCount: 2420,
        grades: ['10', '11', '12'],
        lang: 'en',
        status: 'approved',
        createdAt: 1700000009100
    },
    {
        id: 't_alex_comp',
        name: 'Mr. Alex Cooper',
        subject: 'Computer Science',
        email: 'alex.computer@gmail.com',
        phone: '0750 456 1234',
        bio: 'Computer Science & Software Engineering Instructor for Secondary and High School levels',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80',
        viewsCount: 2150,
        grades: ['10', '11', '12', '9'],
        lang: 'en',
        status: 'approved',
        createdAt: 1700000009200
    },
    {
        id: 't_sarah_bio',
        name: 'Dr. Sarah Jenkins',
        subject: 'Biology',
        email: 'sarah.biology@gmail.com',
        phone: '0750 678 4321',
        bio: 'Doctorate in Molecular Biology, lecturing 12th Grade Advanced Biology in English',
        avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=300&q=80',
        viewsCount: 2340,
        grades: ['10', '11', '12'],
        lang: 'en',
        status: 'approved',
        createdAt: 1700000009300
    },
    {
        id: 't_robert_math',
        name: 'Prof. Robert Vance',
        subject: 'Mathematics',
        email: 'robert.math@gmail.com',
        phone: '0750 890 1234',
        bio: 'Calculus, Trigonometry and Algebra educator for Cambridge and National curricula',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
        viewsCount: 2610,
        grades: ['10', '11', '12', '9'],
        lang: 'en',
        status: 'approved',
        createdAt: 1700000009400
    }
];

// Initial Videos with Subject & Language property
const DEFAULT_VIDEOS = [
    // Badini - Chemistry
    {
        id: 'v_101',
        teacherId: 't_hussein',
        teacherName: 'م. حسێن ئەکرەم زێباری',
        grade: '12',
        subject: 'کیمیا',
        chapter: 'بەندی ١: تێکڕای کارلێکێن کیمیایی',
        title: 'وانا ١: دەستپێک لسەر بەندی ئێکێ و خێراییا کارلێکی',
        youtubeUrl: 'https://www.youtube.com/watch?v=kYJ5sXN6b-Y',
        views: 1650,
        lang: 'ku_ba',
        status: 'approved',
        createdAt: 1700001000000
    },
    {
        id: 'v_102',
        teacherId: 't_sidad',
        teacherName: 'م. سياد عبدالقادر',
        grade: '12',
        subject: 'کیمیا',
        chapter: 'بەندی ٣: ترش و تفت',
        title: 'شیکارکرنا پسیارێن وزاری یێن ترش و تەفتان ب کوردی باهدینی',
        youtubeUrl: 'https://www.youtube.com/watch?v=jNQXAC9IVRw',
        views: 1240,
        lang: 'ku_ba',
        status: 'approved',
        createdAt: 1700002000000
    },
    // Badini - Math
    {
        id: 'v_103',
        teacherId: 't_dilshad',
        teacherName: 'م. دلشاد احمد بارزانی',
        grade: '12',
        subject: 'بیرکاری',
        chapter: 'بەندی ١: نەخشە و وێنەکرن',
        title: 'شیکارییا نەخشەیێن بنەڕەتی و چەمان بۆ پۆلا دوازدێ',
        youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        views: 920,
        lang: 'ku_ba',
        status: 'approved',
        createdAt: 1700003000000
    },
    // Badini - Physics
    {
        id: 'v_104',
        teacherId: 't_newzad_phys',
        teacherName: 'م. نەوزاد بێکەس دهۆکی',
        grade: '12',
        subject: 'فیزیا',
        chapter: 'بەندی ١: تەزوویێ کارەبایی و موگناتیسی',
        title: 'وانا فیزیا پۆلا دوازدێ: یاسایێن کیرشۆف و ئەپڵیکەیشنێن کارەبا',
        youtubeUrl: 'https://www.youtube.com/watch?v=kYJ5sXN6b-Y',
        views: 1180,
        lang: 'ku_ba',
        status: 'approved',
        createdAt: 1700003100000
    },
    // Badini - Biology
    {
        id: 'v_105',
        teacherId: 't_dilvin_bio',
        teacherName: 'م. دڵڤین شێروانی',
        grade: '12',
        subject: 'زیندەوەر',
        chapter: 'بەندی ٢: مایتۆسیس و مایۆسیس و کەرتبوونا خانێ',
        title: 'وانا زیندەوەر پۆلا دوازدێ: دابەشبوونا خانەیان و پەیڕەوا DNA',
        youtubeUrl: 'https://www.youtube.com/watch?v=jNQXAC9IVRw',
        views: 1040,
        lang: 'ku_ba',
        status: 'approved',
        createdAt: 1700003200000
    },
    // Badini - Kurdish
    {
        id: 'v_106',
        teacherId: 't_rebwar_ku',
        teacherName: 'م. ڕێبوار ئامێدی',
        grade: '12',
        subject: 'کوردی',
        chapter: 'بەندی ١: ئەدەبیاتی کوردی و شاعیرێن کلاسیک',
        title: 'وانا ئەدەبێ کوردی: مەلایێ جزیری و شێوازی هۆنراوەیا کلاسیک',
        youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        views: 890,
        lang: 'ku_ba',
        status: 'approved',
        createdAt: 1700003300000
    },
    // Badini - Arabic
    {
        id: 'v_107',
        teacherId: 't_salah_ar',
        teacherName: 'م. سەڵاحەدین دهۆکی',
        grade: '12',
        subject: 'عەرەبی',
        chapter: 'بەندی ١: اسلوب الاستفهام والاعراب',
        title: 'شیکاری یاسایێن اعرابا ناڤێن پرسیارێ ب شێوازەکێ زۆر ساناهی',
        youtubeUrl: 'https://www.youtube.com/watch?v=kYJ5sXN6b-Y',
        views: 940,
        lang: 'ku_ba',
        status: 'approved',
        createdAt: 1700003400000
    },
    // Badini - Religion / Islam
    {
        id: 'v_108',
        teacherId: 't_mala_ahmad',
        teacherName: 'مامۆستا مەلا ئەحمەد زێباری',
        grade: '12',
        subject: 'ئاین',
        chapter: 'بەندی ١: عەقیدە و باوەرییا ئیسلامی',
        title: 'وانا پەروەردەیا ئیسلامی: ڕەوشت و مامەلە د قورئانا پیرۆز دا',
        youtubeUrl: 'https://www.youtube.com/watch?v=jNQXAC9IVRw',
        views: 1120,
        lang: 'ku_ba',
        status: 'approved',
        createdAt: 1700003500000
    },
    // Badini - Computer
    {
        id: 'v_109',
        teacherId: 't_rebin_comp',
        teacherName: 'م. ڕێبین ئاکرەیی',
        grade: '12',
        subject: 'کۆمپیوتەر',
        chapter: 'بەندی ١: داتابەیس و مایکرۆسۆفت ئەکسێس',
        title: 'وانا کۆمپیوتەرێ پۆلا دوازدێ: چێکرنا خشتە و پەیوەندییێن Database',
        youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        views: 870,
        lang: 'ku_ba',
        status: 'approved',
        createdAt: 1700003600000
    },
    // Badini - English
    {
        id: 'v_110',
        teacherId: 't_hevi_ba',
        teacherName: 'م. هێڤی زاخۆیی (English Sunrise)',
        grade: '12',
        subject: 'ئینگلێزی',
        chapter: 'Unit 1: Passive Voice & Conditionals',
        title: 'وانا ئینگلیزی پۆلا ١٢: یاسایێن ڕێزمانی و شیکاریا پرسیارێن وزاری',
        youtubeUrl: 'https://www.youtube.com/watch?v=kYJ5sXN6b-Y',
        views: 1540,
        lang: 'ku_ba',
        status: 'approved',
        createdAt: 1700003700000
    },

    // Sorani
    {
        id: 'v_201',
        teacherId: 't_aras',
        teacherName: 'م. ئاراس کەرکووکی',
        grade: '12',
        subject: 'فیزیا',
        chapter: 'بەندی ١: هێزی کارەبایی و بواری کارەبا',
        title: 'وانەی یەکەم: یاسای کۆڵۆم و پۆتەنشیاڵی کارەبایی (سۆرانی)',
        youtubeUrl: 'https://www.youtube.com/watch?v=kYJ5sXN6b-Y',
        views: 1820,
        lang: 'ku_so',
        status: 'approved',
        createdAt: 1700004000000
    },
    {
        id: 'v_202',
        teacherId: 't_karwan',
        teacherName: 'م. کاروان سلێمانی',
        grade: '12',
        subject: 'کیمیا',
        chapter: 'بەندی ٢: هاوسەنگی کیمیایی',
        title: 'وانەی دووەم: بنەمای لۆشاتلییە و شیکاری پرسیاری وزاری پۆلی ١٢',
        youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        views: 1490,
        lang: 'ku_so',
        status: 'approved',
        createdAt: 1700005000000
    },
    {
        id: 'v_203',
        teacherId: 't_bryar_math',
        teacherName: 'م. بڕیار عەلی چەمچەماڵی',
        grade: '12',
        subject: 'بیرکاری',
        chapter: 'بەندی ١: تەواوکاری و داتاشین',
        title: 'شیکاری پرسیاری وزاری تەواوکاری و داتاشینی پۆلی ١٢ بە سۆرانی',
        youtubeUrl: 'https://www.youtube.com/watch?v=jNQXAC9IVRw',
        views: 1380,
        lang: 'ku_so',
        status: 'approved',
        createdAt: 1700005100000
    },
    {
        id: 'v_204',
        teacherId: 't_sozan',
        teacherName: 'م. سۆزان مەحمود',
        grade: '12',
        subject: 'زیندەوەر',
        chapter: 'بەندی ١: خانە و هەناسەدانی خانەیی',
        title: 'وانەی زیندەوەرزانی پۆلی دوازدەهەمی زانستی بە سۆرانی پاراو',
        youtubeUrl: 'https://www.youtube.com/watch?v=kYJ5sXN6b-Y',
        views: 1250,
        lang: 'ku_so',
        status: 'approved',
        createdAt: 1700005200000
    },

    // Arabic
    {
        id: 'v_301',
        teacherId: 't_ahmed',
        teacherName: 'د. أحمد خالد العبيدي',
        grade: '12',
        subject: 'الكيمياء',
        chapter: 'الفصل الأول: سرعة التفاعل والاتزان الكيميائي',
        title: 'الدرس الأول: مفهوم سرعة التفاعل والعوامل المؤثرة (شرح عربي)',
        youtubeUrl: 'https://www.youtube.com/watch?v=jNQXAC9IVRw',
        views: 1350,
        lang: 'ar',
        status: 'approved',
        createdAt: 1700006000000
    },
    {
        id: 'v_302',
        teacherId: 't_omar',
        teacherName: 'أ. عمر فاضل السامرائي',
        grade: '12',
        subject: 'الفيزياء',
        chapter: 'الفصل الأول: المتسعات والدوائر الكهربائية',
        title: 'شرح شامل لقوانين ربط المتسعات على التوالي والتوازي للمرحلة الإعدادية',
        youtubeUrl: 'https://www.youtube.com/watch?v=kYJ5sXN6b-Y',
        views: 1290,
        lang: 'ar',
        status: 'approved',
        createdAt: 1700006100000
    },
    {
        id: 'v_303',
        teacherId: 't_tariq_math',
        teacherName: 'أ. طارق التميمي',
        grade: '12',
        subject: 'الرياضيات',
        chapter: 'الفصل الثالث: تطبيقات التفاضل والتكامل',
        title: 'حل المسائل الوزارية لمادة الرياضيات للصف الثاني عشر العلمي',
        youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        views: 1410,
        lang: 'ar',
        status: 'approved',
        createdAt: 1700006200000
    },

    // English
    {
        id: 'v_401',
        teacherId: 't_hevi',
        teacherName: 'م. هێڤی زاخۆیی (English Sunrise)',
        grade: '12',
        subject: 'English',
        chapter: 'Unit 1: Language and Communication',
        title: 'Grade 12 English Sunrise: Grammar Mastery & Reading Passages',
        youtubeUrl: 'https://www.youtube.com/watch?v=kYJ5sXN6b-Y',
        views: 1980,
        lang: 'en',
        status: 'approved',
        createdAt: 1700007000000
    },
    {
        id: 'v_402',
        teacherId: 't_david',
        teacherName: 'Mr. David Miller',
        grade: '12',
        subject: 'Chemistry',
        chapter: 'Chapter 1: Chemical Kinetics',
        title: 'Reaction Rates, Collision Theory & Activation Energy in English',
        youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        views: 1110,
        lang: 'en',
        status: 'approved',
        createdAt: 1700008000000
    },
    {
        id: 'v_403',
        teacherId: 't_john_phys',
        teacherName: 'Mr. John Edwards',
        grade: '12',
        subject: 'Physics',
        chapter: 'Unit 2: Electromagnetic Fields',
        title: 'Electric Potential, Gauss Law and Capacitance Step-by-Step Tutorial',
        youtubeUrl: 'https://www.youtube.com/watch?v=jNQXAC9IVRw',
        views: 1220,
        lang: 'en',
        status: 'approved',
        createdAt: 1700008100000
    },
    {
        id: 'v_404',
        teacherId: 't_alex_comp',
        teacherName: 'Mr. Alex Cooper',
        grade: '12',
        subject: 'Computer Science',
        chapter: 'Module 1: Relational Database Systems',
        title: 'SQL Fundamentals, Relational Architecture and Database Normalization',
        youtubeUrl: 'https://www.youtube.com/watch?v=kYJ5sXN6b-Y',
        views: 990,
        lang: 'en',
        status: 'approved',
        createdAt: 1700008200000
    }
];

// Initial Quizzes with Subject & Language property
const DEFAULT_QUIZZES = [
    // Badini - Chemistry
    {
        id: 'q_101',
        teacherId: 't_hussein',
        teacherName: 'م. حسێن ئەکرەم زێباری',
        grade: '12',
        subject: 'کیمیا',
        chapter: 'بەندی ١: تێکڕای کارلێک',
        question: 'ئەگەر پلەیا گەرمییێ زێدە ببیتن، تێکڕایێ کارلێکی چ لێ دهێت؟',
        options: ['زێدە دبیت', 'کێم دبیت', 'ناگوهۆڕیت', 'سفر دبیت'],
        correctIndex: 0,
        explanation: 'زێدەبوونا پلەیا گەرمیێ وزەیا جوولێ یا گەردان زێدە دکەت و بەریەککەفتنێن باندۆر پتر لێ دکەت.',
        lang: 'ku_ba',
        status: 'approved',
        createdAt: 1700010000000
    },
    {
        id: 'q_102',
        teacherId: 't_sidad',
        teacherName: 'م. سياد عبدالقادر',
        grade: '12',
        subject: 'کیمیا',
        chapter: 'بەندی ٣: ترش و تفت',
        question: 'بهایێ pH بۆ گیراوەیەکێ دەولەمەند ب ترش چەندە؟',
        options: ['ژ ٧ کێمترە', 'ژ ٧ پترە', 'ڕێک ٧ یە', '١٤ یە'],
        correctIndex: 0,
        explanation: 'گیراوەیێن ترش بهایێ وان یێ pH کێمترە ژ ٧.',
        lang: 'ku_ba',
        status: 'approved',
        createdAt: 1700011000000
    },
    // Badini - Physics
    {
        id: 'q_103',
        teacherId: 't_newzad_phys',
        teacherName: 'م. نەوزاد بێکەس دهۆکی',
        grade: '12',
        subject: 'فیزیا',
        chapter: 'بەندی ١: هێزا کارەبا',
        question: 'یەکەی پێڤانا بەرگرییا کارەبایی د سیستەمێ نێڤدەولەتی دا چییە؟',
        options: ['ئۆم (Ω)', 'ڤۆڵت (V)', 'ئەمپێر (A)', 'تێسلا (T)'],
        correctIndex: 0,
        explanation: 'بەرگرییا کارەبایی ب یەکا ئۆم (Ohm) دهێتە پێڤان ل دوویف یاسایا ئۆمی R = V / I.',
        lang: 'ku_ba',
        status: 'approved',
        createdAt: 1700011100000
    },
    // Badini - Math
    {
        id: 'q_104',
        teacherId: 't_dilshad',
        teacherName: 'م. دلشاد احمد بارزانی',
        grade: '12',
        subject: 'بیرکاری',
        chapter: 'بەندی ١: داتاشین',
        question: 'داتاشراوا نەخشەیا f(x) = x³ چەندە؟',
        options: ['3x²', 'x²', '3x', '3'],
        correctIndex: 0,
        explanation: 'ل دوویف یاسایا داتاشینا هێزێ: d/dx(xⁿ) = n·xⁿ⁻¹، ئانکو 3x².',
        lang: 'ku_ba',
        status: 'approved',
        createdAt: 1700011200000
    },
    // Badini - Biology
    {
        id: 'q_105',
        teacherId: 't_dilvin_bio',
        teacherName: 'م. دڵڤین شێروانی',
        grade: '12',
        subject: 'زیندەوەر',
        chapter: 'بەندی ٢: زیندەوەرزانییا خانەیی',
        question: 'کیش بەشێ خانێ بەرپرسە ژ بەرهەمهێنانا وزەیێ (ATP)؟',
        options: ['مایتۆکۆندریا', 'ناوک (ناڤک)', 'دەزگای گۆڵجی', 'ڕایبۆسۆم'],
        correctIndex: 0,
        explanation: 'مایتۆکۆندریا کارگەی وزەیێ یە د خانێ دا ب ڕێکا کرداری هەناسەدانا خانەیی.',
        lang: 'ku_ba',
        status: 'approved',
        createdAt: 1700011300000
    },
    // Badini - Computer
    {
        id: 'q_106',
        teacherId: 't_rebin_comp',
        teacherName: 'م. ڕێبین ئاکرەیی',
        grade: '12',
        subject: 'کۆمپیوتەر',
        chapter: 'بەندی ١: پایگەی دراوە (Database)',
        question: 'مفایێ سەرەکی یێ کلیلا سەرەکی (Primary Key) چییە د خشتەیێن داتابەیسێ دا؟',
        options: ['ڕێگری دکەت ژ دووبارەبوونا تۆماران و ناسنامەکا بێهاوتایە', 'تەنێ بۆ جوانکارییێ یە', 'داتایان ژناڤ دبەت', 'قەبارەی فایلێ کێم دکەت'],
        correctIndex: 0,
        explanation: 'Primary Key کلیلا سەرەکییە و ناکرێت دووبارە ببێتەوە یان بەتاڵ بێت.',
        lang: 'ku_ba',
        status: 'approved',
        createdAt: 1700011400000
    },

    // Sorani
    {
        id: 'q_201',
        teacherId: 't_aras',
        teacherName: 'م. ئاراس کەرکووکی',
        grade: '12',
        subject: 'فیزیا',
        chapter: 'بەندی ١: بواری کارەبا',
        question: 'یەکەی پێوانی بواری کارەبایی (E) لە سیستەمی نێودەوڵەتیدا چییە؟',
        options: ['N/C (نیوتن/کۆڵۆم)', 'Joule (جووڵ)', 'Watt (وات)', 'Volt (ڤۆڵت)'],
        correctIndex: 0,
        explanation: 'بواری کارەبایی یەکسانە بە هێز بەسەر بارگە، کە دەکاتە N/C.',
        lang: 'ku_so',
        status: 'approved',
        createdAt: 1700012000000
    },

    // Arabic
    {
        id: 'q_301',
        teacherId: 't_ahmed',
        teacherName: 'د. أحمد خالد العبيدي',
        grade: '12',
        subject: 'الكيمياء',
        chapter: 'الفصل الأول: الاتزان الكيميائي',
        question: 'ما هو تأثير إضافة العامل المساعد على موضع الاتزان الكيميائي؟',
        options: ['لا يؤثر على موضع الاتزان إطلاقاً', 'يزيح الاتزان نحو اليمين', 'يزيح الاتزان نحو اليسار', 'يغير قيمة ثابت الاتزان'],
        correctIndex: 0,
        explanation: 'العامل المساعد يزيد من سرعة التفاعلين الأمامي والخلفي بنفس النسبة فلا يؤثر على موضع الاتزان.',
        lang: 'ar',
        status: 'approved',
        createdAt: 1700013000000
    },

    // English
    {
        id: 'q_401',
        teacherId: 't_david',
        teacherName: 'Mr. David Miller',
        grade: '12',
        subject: 'Chemistry',
        chapter: 'Chapter 1: Chemical Equilibrium',
        question: 'What is the effect of increasing temperature on an endothermic reaction at equilibrium?',
        options: ['Shifts equilibrium to products (right)', 'Shifts equilibrium to reactants (left)', 'Has no effect', 'Decreases rate of reaction'],
        correctIndex: 0,
        explanation: 'For endothermic reactions (absorbing heat), heat acts as a reactant; increasing it shifts equilibrium forward.',
        lang: 'en',
        status: 'approved',
        createdAt: 1700014000000
    }
];

// Initial Multi-Format Malzamas (PowerPoint, HTML, Image, PDF)
const DEFAULT_MALZAMAS = [
    // 1. PDF (Badini - Chemistry)
    {
        id: 'm_101',
        teacherId: 't_hussein',
        teacherName: 'م. حسێن ئەکرەم زێباری',
        grade: '12',
        subject: 'کیمیا',
        chapter: 'پوختەیا بەندی ئێکێ و دووێ',
        title: 'مەلزەما تێروتەسەل یا کیمیایا پۆلا ١٢ (PDF)',
        fileType: 'pdf',
        fileUrl: 'https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/examples/learning/helloworld.pdf',
        fileName: 'kimiya_pola12_hussein.pdf',
        fileSize: '4.8 MB',
        description: 'کورتە و یاسایێن کیمیایا پۆلا دوازدێ ب شێوازی PDF یێ تێروتەسەل دگەل نموونەیێن وزاری.',
        views: 2150,
        lang: 'ku_ba',
        status: 'approved',
        createdAt: 1700020000000
    },
    // 2. PowerPoint (.pptx) (Badini - Chemistry)
    {
        id: 'm_102',
        teacherId: 't_hussein',
        teacherName: 'م. حسێن ئەکرەم زێباری',
        grade: '12',
        subject: 'کیمیا',
        chapter: 'بەندی ١: سلاک و پرێزنتەیشن',
        title: 'سلايدێن پاوەرپوینت یێن تێکڕای کارلێکێن کیمیایی (PowerPoint PPTX)',
        fileType: 'pptx',
        fileUrl: 'https://view.officeapps.live.com/op/view.aspx?src=https://file-examples.com/storage/fe9266e7ea662ff8b54325a/2017/08/file_example_PPTX_500kB.pptx',
        fileName: 'chem_reaction_rates_slides.pptx',
        fileSize: '3.4 MB',
        description: 'سلایدێن فەرمی یێن وانێ ب پاوەرپوینت بۆ مامۆستا و قوتابیان بۆ داتاشۆ و پیشاندانێ ب شێوەیەکێ ئەنیمەیشن.',
        views: 1890,
        lang: 'ku_ba',
        status: 'approved',
        createdAt: 1700021000000
    },
    // 3. HTML Interactive Document (Badini - Chemistry)
    {
        id: 'm_103',
        teacherId: 't_sidad',
        teacherName: 'م. سياد عبدالقادر',
        grade: '12',
        subject: 'کیمیا',
        chapter: 'بەندی ٣: پوختەی ئینتەرئەکتیڤ',
        title: 'پوختە و جەدوەلی کارلێکێن کیمیایی (پەڕەی ئینتەرئەکتیڤ HTML)',
        fileType: 'html',
        fileUrl: '',
        htmlContent: `<!DOCTYPE html><html dir="rtl" lang="ku"><head><meta charset="utf-8"><style>body{font-family:sans-serif;padding:25px;background:#f8f9fa;color:#222;line-height:1.7;}h2{color:#007bff;border-bottom:2px solid #007bff;padding-bottom:8px;}table{width:100%;border-collapse:collapse;margin:15px 0;}th,td{border:1px solid #ccc;padding:10px;text-align:right;}th{background:#007bff;color:#fff;}.highlight{background:#e7f1ff;padding:10px;border-radius:8px;font-weight:bold;margin:15px 0;}</style></head><body><h2>خشتەی ترش و تفتێن سەرەکی - پۆلا دوازدێ</h2><div class="highlight">💡 تێبینییا زێڕین: هێزا ترشێ پشت ب ڕادەیێ هەڵوەشینێ دەبەستیت، نە خەستییا گیراوەی.</div><table><tr><th>ترش یان تفت</th><th>جۆر</th><th>هاوکێشەی کارلێک</th><th>pH</th></tr><tr><td>ترشێ هایدرۆکلۆریک (HCl)</td><td>ترشێ بەهێز</td><td>HCl + H2O → H3O+ + Cl-</td><td>&lt; 2</td></tr><tr><td>ترشێ هایدرۆفلۆریک (HF)</td><td>ترشێ لاواز</td><td>HF + H2O ⇌ H3O+ + F-</td><td>3 - 5</td></tr><tr><td>هایدرۆکسیدی سۆدیۆم (NaOH)</td><td>تفتی بەهێز</td><td>NaOH → Na+ + OH-</td><td>&gt; 12</td></tr></table><p style="text-align:center;color:#666;font-size:0.85rem;">ئامادەکردنی: م. سياد عبدالقادر - وانەی کیمیای پۆلی ١٢</p></body></html>`,
        fileName: 'interactive_chemistry_guide.html',
        fileSize: '18 KB',
        description: 'پەڕەیەکی ڕێبەری هەمەلایەنە بە شێوازی HTML کە ڕاستەوخۆ دەتوانیت لەناو ماڵپەڕ بخوێنیتەوە و خشتەکانی کارلێک لێکبدەیتەوە.',
        views: 1420,
        lang: 'ku_ba',
        status: 'approved',
        createdAt: 1700022000000
    },
    // 4. Image Diagram / Summary (Badini - Chemistry)
    {
        id: 'm_104',
        teacherId: 't_hussein',
        teacherName: 'م. حسێن ئەکرەم زێباری',
        grade: '12',
        subject: 'کیمیا',
        chapter: 'وێنە و دیاگرامێن وزاری',
        title: 'وێنەیا ڕوون یێن هێلکاریا تیشک و پەیكەری گەردیلێ (Image)',
        fileType: 'image',
        fileUrl: 'https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6?auto=format&fit=crop&w=1200&q=80',
        fileName: 'chemistry_orbital_diagram.jpg',
        fileSize: '1.2 MB',
        description: 'هێڵکاریی ورد و ڕوونکردنەوەی وێنەیی بۆ شێوازی پەیوەستبوونی گەردیلەکان و ئەلیکترۆنەکان بە کوالیتی بەرز.',
        views: 1670,
        lang: 'ku_ba',
        status: 'approved',
        createdAt: 1700023000000
    },
    // 5. PowerPoint (.pptx) (Badini - Physics)
    {
        id: 'm_105',
        teacherId: 't_newzad_phys',
        teacherName: 'م. نەوزاد بێکەس دهۆکی',
        grade: '12',
        subject: 'فیزیا',
        chapter: 'بەندی ١: هێزی کارەبایی',
        title: 'پرێزنتەیشنی پاوەرپوینت یاسایێن فیزیا پۆلا دوازدێ (PPTX)',
        fileType: 'pptx',
        fileUrl: 'https://view.officeapps.live.com/op/view.aspx?src=https://file-examples.com/storage/fe9266e7ea662ff8b54325a/2017/08/file_example_PPTX_500kB.pptx',
        fileName: 'physics_grade12_slides.pptx',
        fileSize: '4.2 MB',
        description: 'سلایدێن تەواوی وانەیا فیزیا پۆلا دوازدێ دگەل هاوکێشە و یاسایان.',
        views: 1510,
        lang: 'ku_ba',
        status: 'approved',
        createdAt: 1700023100000
    },
    // 6. PDF (Badini - Math)
    {
        id: 'm_106',
        teacherId: 't_dilshad',
        teacherName: 'م. دلشاد احمد بارزانی',
        grade: '12',
        subject: 'بیرکاری',
        chapter: 'بەندی ١: نەخشە و داتاشین',
        title: 'مەلزەما بیرکاری پۆلا دوازدێ یا زانستی (PDF)',
        fileType: 'pdf',
        fileUrl: 'https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/examples/learning/helloworld.pdf',
        fileName: 'math_grade12_dilshad.pdf',
        fileSize: '5.1 MB',
        description: 'پوختەی یاساکانی داتاشین و تەواوکاری و شیکاری تەواوی پرسیارە وزارییەکان.',
        views: 1820,
        lang: 'ku_ba',
        status: 'approved',
        createdAt: 1700023200000
    },
    // 7. HTML Interactive (Badini - Biology)
    {
        id: 'm_107',
        teacherId: 't_dilvin_bio',
        teacherName: 'م. دڵڤین شێروانی',
        grade: '12',
        subject: 'زیندەوەر',
        chapter: 'بەندی ٢: ڕێبەری هێڵکاری خانە',
        title: 'ڕێبەری ئینتەرئەکتیڤی خانەی زیندەوەر و شیکاری DNA (HTML)',
        fileType: 'html',
        fileUrl: '',
        htmlContent: `<!DOCTYPE html><html dir="rtl" lang="ku"><head><meta charset="utf-8"><style>body{font-family:sans-serif;padding:25px;background:#f4f9f4;color:#222;line-height:1.7;}h2{color:#2a9d8f;border-bottom:2px solid #2a9d8f;padding-bottom:8px;}table{width:100%;border-collapse:collapse;margin:15px 0;}th,td{border:1px solid #ccc;padding:10px;text-align:right;}th{background:#2a9d8f;color:#fff;}.box{background:#e8f5e9;padding:12px;border-radius:8px;font-weight:bold;margin:15px 0;}</style></head><body><h2>بەراوردکردنی خانەی رووەکی و گیانەوەری</h2><div class="box">🧬 تایبەتمەندی دیواری خانە تەنها لە خانەی رووەکیدا هەیە و لە ڕەقبوونی سلۆلۆز پێکهاتووە.</div><table><tr><th>بەشێ خانێ</th><th>خانەی گیانەوەری</th><th>خانەی رووەکی</th></tr><tr><td>دیواری خانە</td><td>نییە</td><td>هەیە (سلۆلۆز)</td></tr><tr><td>کلۆرۆپلاست</td><td>نییە</td><td>هەیە (بۆ رۆشنەپێکهاتن)</td></tr><tr><td>مایتۆکۆندریا</td><td>هەیە</td><td>هەیە</td></tr></table><p style="text-align:center;color:#666;">ئامادەکردنی: م. دڵڤین شێروانی</p></body></html>`,
        fileName: 'biology_cell_interactive.html',
        fileSize: '15 KB',
        description: 'پەڕەیەکی خوێندنەوەی بەراوردکاری خانە بۆ پۆلی ١٢ بە شێوەی ئینتەرئەکتیڤ.',
        views: 1390,
        lang: 'ku_ba',
        status: 'approved',
        createdAt: 1700023300000
    },

    // Sorani Malzamas
    {
        id: 'm_201',
        teacherId: 't_karwan',
        teacherName: 'م. کاروان سلێمانی',
        grade: '12',
        subject: 'کیمیا',
        chapter: 'پوختەی کیمیای پۆلی ١٢',
        title: 'کورتکراوە و یاساکانی کیمیای وزاری پۆلی ١٢ (PDF)',
        fileType: 'pdf',
        fileUrl: 'https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/examples/learning/helloworld.pdf',
        fileName: 'kimiya_sorani_pola12.pdf',
        fileSize: '5.2 MB',
        description: 'کورتەی سەرجەم بەندەکانی کیمیای دواناوەندی بە سۆرانی پاراو بە شێوازی PDF.',
        views: 1940,
        lang: 'ku_so',
        status: 'approved',
        createdAt: 1700024000000
    },
    {
        id: 'm_202',
        teacherId: 't_aras',
        teacherName: 'م. ئاراس کەرکووکی',
        grade: '12',
        subject: 'فیزیا',
        chapter: 'سلایدەکانی فیزیا',
        title: 'سلايدەکانی پاوەرپۆینتی فیزیای وزاری (PowerPoint PPTX)',
        fileType: 'pptx',
        fileUrl: 'https://view.officeapps.live.com/op/view.aspx?src=https://file-examples.com/storage/fe9266e7ea662ff8b54325a/2017/08/file_example_PPTX_500kB.pptx',
        fileName: 'physics_slides_sorani.pptx',
        fileSize: '4.1 MB',
        description: 'سلایدی تایبەت بە مامۆستایان و قوتابیان بۆ پیشاندانی یاساکانی فیزیا بە شێوەی پرێزنتەیشن.',
        views: 1610,
        lang: 'ku_so',
        status: 'approved',
        createdAt: 1700025000000
    },

    // Arabic Malzamas
    {
        id: 'm_301',
        teacherId: 't_ahmed',
        teacherName: 'د. أحمد خالد العبيدي',
        grade: '12',
        subject: 'الكيمياء',
        chapter: 'ملزمة الكيمياء الشاملة',
        title: 'ملزمة الكيمياء الوزارية للصف الثاني عشر العلمي (PDF)',
        fileType: 'pdf',
        fileUrl: 'https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/examples/learning/helloworld.pdf',
        fileName: 'chemistry_ar_grade12.pdf',
        fileSize: '6.5 MB',
        description: 'ملخص شامل لجميع فصول الكيمياء مع حلول الأسئلة الوزارية والتمارين النموذجية باللغة العربية.',
        views: 1780,
        lang: 'ar',
        status: 'approved',
        createdAt: 1700026000000
    },

    // English Malzamas
    {
        id: 'm_401',
        teacherId: 't_hevi',
        teacherName: 'م. هێڤی زاخۆیی (English Sunrise)',
        grade: '12',
        subject: 'English',
        chapter: 'Grammar and Booklet',
        title: 'Grade 12 Complete English Sunrise Study Guide (PDF)',
        fileType: 'pdf',
        fileUrl: 'https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/examples/learning/helloworld.pdf',
        fileName: 'english_sunrise_grade12.pdf',
        fileSize: '4.4 MB',
        description: 'Comprehensive study guide with grammar rules, reading comprehension, and national exam model answers.',
        views: 2210,
        lang: 'en',
        status: 'approved',
        createdAt: 1700028000000
    },
    {
        id: 'm_402',
        teacherId: 't_david',
        teacherName: 'Mr. David Miller',
        grade: '12',
        subject: 'Chemistry',
        chapter: 'Chemical Kinetics Slides',
        title: 'Reaction Kinetics & Energetics PowerPoint Slide Deck (PPTX)',
        fileType: 'pptx',
        fileUrl: 'https://view.officeapps.live.com/op/view.aspx?src=https://file-examples.com/storage/fe9266e7ea662ff8b54325a/2017/08/file_example_PPTX_500kB.pptx',
        fileName: 'reaction_kinetics_deck.pptx',
        fileSize: '5.0 MB',
        description: 'Full animated presentation slides designed for interactive whiteboards and student self-review.',
        views: 1540,
        lang: 'en',
        status: 'approved',
        createdAt: 1700029000000
    }
];

// Master Storage Class
class EducationalDataStore {
    constructor() {
        this.STORAGE_KEY_TEACHERS = 'app_learn_teachers_v5';
        this.STORAGE_KEY_VIDEOS = 'app_learn_videos_v5';
        this.STORAGE_KEY_QUIZZES = 'app_learn_quizzes_v5';
        this.STORAGE_KEY_MALZAMAS = 'app_learn_malzamas_v5';
        this.STORAGE_KEY_CURRENT_ROLE = 'app_learn_user_role';
        this.STORAGE_KEY_CURRENT_TEACHER = 'app_learn_current_teacher';
        this.STORAGE_KEY_STUDENT_GRADES = 'app_learn_student_grades';

        this.initLocalData();
        this.initFirestoreSync();
    }

    initLocalData() {
        const seedStorage = (key, defaultArray) => {
            let current = [];
            try {
                const stored = localStorage.getItem(key);
                if (stored) current = JSON.parse(stored);
            } catch (e) {
                current = [];
            }
            if (!Array.isArray(current) || current.length === 0) {
                localStorage.setItem(key, JSON.stringify(defaultArray));
                return;
            }
            // Auto-merge any missing defaults
            const currentIds = new Set(current.map(item => item.id));
            let merged = false;
            defaultArray.forEach(defItem => {
                if (!currentIds.has(defItem.id)) {
                    current.push(defItem);
                    merged = true;
                }
            });
            if (merged) {
                localStorage.setItem(key, JSON.stringify(current));
            }
        };

        seedStorage(this.STORAGE_KEY_TEACHERS, DEFAULT_TEACHERS);
        seedStorage(this.STORAGE_KEY_VIDEOS, DEFAULT_VIDEOS);
        seedStorage(this.STORAGE_KEY_QUIZZES, DEFAULT_QUIZZES);
        seedStorage(this.STORAGE_KEY_MALZAMAS, DEFAULT_MALZAMAS);
    }

    async initFirestoreSync() {
        if (typeof firebase === 'undefined' || !firebase.apps || !firebase.apps.length) return;
        try {
            const db = firebase.firestore();
            
            // Sync Teachers from Firestore
            db.collection('teachers').onSnapshot(snap => {
                if (!snap.empty) {
                    const firestoreTeachers = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                    this.mergeLocalWithRemote(this.STORAGE_KEY_TEACHERS, firestoreTeachers);
                }
            }, err => console.log('Firestore teachers sync note:', err.message));

            // Sync Content
            db.collection('educational_content').onSnapshot(snap => {
                if (!snap.empty) {
                    const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                    const videos = items.filter(i => i.type === 'video');
                    const quizzes = items.filter(i => i.type === 'quiz');
                    const malzamas = items.filter(i => i.type === 'malzama');
                    if (videos.length) this.mergeLocalWithRemote(this.STORAGE_KEY_VIDEOS, videos);
                    if (quizzes.length) this.mergeLocalWithRemote(this.STORAGE_KEY_QUIZZES, quizzes);
                    if (malzamas.length) this.mergeLocalWithRemote(this.STORAGE_KEY_MALZAMAS, malzamas);
                }
            }, err => console.log('Firestore content sync note:', err.message));
        } catch (e) {
            console.log('Firestore init note:', e.message);
        }
    }

    mergeLocalWithRemote(storageKey, remoteItems) {
        try {
            const local = JSON.parse(localStorage.getItem(storageKey) || '[]');
            const map = new Map();
            local.forEach(i => map.set(i.id, i));
            remoteItems.forEach(i => map.set(i.id, i));
            localStorage.setItem(storageKey, JSON.stringify(Array.from(map.values())));
        } catch (e) {}
    }

    // ==========================================
    // LANGUAGE SETTINGS & DISPATCH
    // ==========================================
    getActiveLanguage() {
        return localStorage.getItem('userLanguage') || 'ku_ba';
    }

    setActiveLanguage(lang) {
        let validLang = 'ku_ba';
        if (['ku_ba', 'ku_so', 'ar', 'en'].includes(lang)) {
            validLang = lang;
        }
        localStorage.setItem('userLanguage', validLang);
        window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang: validLang } }));
        return validLang;
    }

    getLanguageLabel(langCode) {
        switch(langCode) {
            case 'ku_ba': return 'باهدینی';
            case 'ku_so': return 'سۆرانی';
            case 'ar': return 'عەرەبی';
            case 'en': return 'English';
            default: return 'باهدینی';
        }
    }

    // ==========================================
    // CURRICULUM SUBJECTS HELPERS
    // ==========================================
    getSubjectsForGrade(gradeId) {
        const gid = String(gradeId || '12');
        return CURRICULUM_SUBJECTS.filter(s => s.grades.includes(gid) || s.grades.includes('all'));
    }

    getAllSubjects() {
        return CURRICULUM_SUBJECTS;
    }

    getSubjectById(subjectId) {
        return CURRICULUM_SUBJECTS.find(s => s.id === subjectId || s.key === subjectId) || null;
    }

    // Smart matching between a teacher/content subject string and a subject definition
    matchesSubject(subjectString, targetSubjectIdOrKey) {
        if (!subjectString || !targetSubjectIdOrKey) return true;
        if (targetSubjectIdOrKey === 'all') return true;

        const targetSubject = CURRICULUM_SUBJECTS.find(s => s.id === targetSubjectIdOrKey || s.key === targetSubjectIdOrKey);
        const subLower = String(subjectString).toLowerCase().trim();

        if (targetSubject) {
            if (subLower === targetSubject.id.toLowerCase() || subLower === targetSubject.name.toLowerCase()) return true;
            return targetSubject.keywords.some(kw => subLower.includes(kw.toLowerCase()));
        }

        return subLower.includes(String(targetSubjectIdOrKey).toLowerCase());
    }

    // ==========================================
    // STUDENT GRADE PREFERENCES (FOLLOWED GRADES)
    // ==========================================
    getStudentGrades() {
        try {
            const raw = localStorage.getItem(this.STORAGE_KEY_STUDENT_GRADES);
            if (!raw) return null;
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) return parsed;
            return null;
        } catch (e) {
            return null;
        }
    }

    setStudentGrades(gradesArray) {
        if (!Array.isArray(gradesArray) || gradesArray.length === 0) {
            gradesArray = ['10', '11', '12'];
        }
        localStorage.setItem(this.STORAGE_KEY_STUDENT_GRADES, JSON.stringify(gradesArray));
        window.dispatchEvent(new CustomEvent('studentGradesChanged', { detail: { grades: gradesArray } }));
    }

    clearStudentGrades() {
        localStorage.removeItem(this.STORAGE_KEY_STUDENT_GRADES);
        window.dispatchEvent(new CustomEvent('studentGradesChanged', { detail: { grades: null } }));
    }

    hasStudentChosenGrades() {
        return !!localStorage.getItem(this.STORAGE_KEY_STUDENT_GRADES);
    }

    // ==========================================
    // ROLE & TEACHER MANAGEMENT
    // ==========================================
    getUserRole() {
        return localStorage.getItem(this.STORAGE_KEY_CURRENT_ROLE) || null;
    }

    setUserRole(role) {
        localStorage.setItem(this.STORAGE_KEY_CURRENT_ROLE, role);
        window.dispatchEvent(new CustomEvent('userRoleChanged', { detail: { role } }));
    }

    getCurrentTeacher() {
        try {
            return JSON.parse(localStorage.getItem(this.STORAGE_KEY_CURRENT_TEACHER) || 'null');
        } catch (e) {
            return null;
        }
    }

    setCurrentTeacher(teacher) {
        localStorage.setItem(this.STORAGE_KEY_CURRENT_TEACHER, JSON.stringify(teacher));
    }

    isCurrentUserSuperAdmin() {
        if (typeof firebase !== 'undefined' && firebase.auth && firebase.auth().currentUser) {
            const email = firebase.auth().currentUser.email;
            if (email && email.trim().toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) return true;
        }
        const currentTeacher = this.getCurrentTeacher();
        if (currentTeacher && currentTeacher.email && currentTeacher.email.trim().toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) {
            return true;
        }
        const adminFlag = localStorage.getItem('is_admin_mode_active');
        return adminFlag === 'true';
    }

    // Teacher Management
    getAllTeachers(filterLang = null) {
        try {
            let list = JSON.parse(localStorage.getItem(this.STORAGE_KEY_TEACHERS) || '[]');
            if (!Array.isArray(list) || list.length === 0) {
                list = DEFAULT_TEACHERS;
            }
            if (filterLang) {
                list = list.filter(t => (t.lang || 'ku_ba') === filterLang);
            }
            return list.sort((a, b) => (b.viewsCount || 0) - (a.viewsCount || 0));
        } catch (e) {
            return DEFAULT_TEACHERS;
        }
    }

    getTeacherById(id) {
        const teachers = this.getAllTeachers();
        return teachers.find(t => t.id === id) || null;
    }

    saveTeacher(teacherData) {
        const teachers = this.getAllTeachers();
        const existingIndex = teachers.findIndex(t => t.id === teacherData.id || (teacherData.email && t.email && t.email.toLowerCase() === teacherData.email.toLowerCase()));
        
        let savedTeacher;
        if (existingIndex >= 0) {
            savedTeacher = { ...teachers[existingIndex], ...teacherData };
            teachers[existingIndex] = savedTeacher;
        } else {
            savedTeacher = {
                id: teacherData.id || 't_' + Date.now(),
                name: teacherData.name,
                subject: teacherData.subject || 'کیمیا',
                email: teacherData.email || '',
                phone: teacherData.phone || '',
                bio: teacherData.bio || 'مامۆستایێ شارەزا',
                avatar: teacherData.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
                viewsCount: teacherData.viewsCount || 10,
                grades: teacherData.grades || ['10', '11', '12'],
                lang: teacherData.lang || this.getActiveLanguage(),
                status: 'approved',
                createdAt: Date.now()
            };
            teachers.push(savedTeacher);
        }

        localStorage.setItem(this.STORAGE_KEY_TEACHERS, JSON.stringify(teachers));
        this.setCurrentTeacher(savedTeacher);

        if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length) {
            try {
                firebase.firestore().collection('teachers').doc(savedTeacher.id).set(savedTeacher, { merge: true });
            } catch (e) {}
        }
        return savedTeacher;
    }

    // Increment Teacher and Content View Count
    incrementViews(teacherId, contentId = null, contentType = null) {
        const teachers = this.getAllTeachers();
        const tIndex = teachers.findIndex(t => t.id === teacherId);
        if (tIndex >= 0) {
            teachers[tIndex].viewsCount = (teachers[tIndex].viewsCount || 0) + 1;
            localStorage.setItem(this.STORAGE_KEY_TEACHERS, JSON.stringify(teachers));

            if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length) {
                try {
                    firebase.firestore().collection('teachers').doc(teacherId).update({
                        viewsCount: firebase.firestore.FieldValue.increment(1)
                    }).catch(() => {});
                } catch(e) {}
            }
        }

        if (contentId && contentType) {
            let key = null;
            if (contentType === 'video') key = this.STORAGE_KEY_VIDEOS;
            else if (contentType === 'malzama') key = this.STORAGE_KEY_MALZAMAS;

            if (key) {
                try {
                    const items = JSON.parse(localStorage.getItem(key) || '[]');
                    const idx = items.findIndex(i => i.id === contentId);
                    if (idx >= 0) {
                        items[idx].views = (items[idx].views || 0) + 1;
                        localStorage.setItem(key, JSON.stringify(items));
                    }
                } catch (e) {}
            }
        }
    }

    // Get Teachers for Grade STRICTLY filtered by selected Language & Optional Subject
    // Sorted by most watched / views descending!
    getTeachersForGrade(gradeId, customLang = null, subjectKey = null) {
        const targetLang = customLang || this.getActiveLanguage();
        let allTeachers = this.getAllTeachers().filter(t => (t.lang || 'ku_ba') === targetLang);
        
        const videos = this.getAllVideos(true, null, false, targetLang);
        const quizzes = this.getAllQuizzes(true, null, false, targetLang);
        const malzamas = this.getAllMalzamas(true, null, false, targetLang);

        const gradeTeachersMap = new Map();

        // 1. Teachers tagged for this grade
        allTeachers.forEach(t => {
            if (t.grades && (t.grades.includes(String(gradeId)) || t.grades.includes('all'))) {
                if (!subjectKey || subjectKey === 'all' || this.matchesSubject(t.subject, subjectKey)) {
                    gradeTeachersMap.set(t.id, t);
                }
            }
        });

        // 2. Teachers who published content in this grade
        const checkContent = (item) => {
            if (String(item.grade) === String(gradeId)) {
                if (!subjectKey || subjectKey === 'all' || this.matchesSubject(item.subject, subjectKey)) {
                    const teacher = this.getTeacherById(item.teacherId);
                    if (teacher && (teacher.lang || 'ku_ba') === targetLang) {
                        gradeTeachersMap.set(teacher.id, teacher);
                    }
                }
            }
        };
        videos.forEach(checkContent);
        quizzes.forEach(checkContent);
        malzamas.forEach(checkContent);

        // Fallback: If a specific subject was picked and no teachers mapped directly to this grade,
        // match ANY teacher in this language that teaches this subject
        if (gradeTeachersMap.size === 0 && subjectKey && subjectKey !== 'all') {
            allTeachers.forEach(t => {
                if (this.matchesSubject(t.subject, subjectKey)) {
                    gradeTeachersMap.set(t.id, t);
                }
            });
        }

        // Fallback: If no teacher in this exact grade for this language, and no specific subject filter
        if (gradeTeachersMap.size === 0 && (!subjectKey || subjectKey === 'all') && allTeachers.length > 0) {
            allTeachers.slice(0, 3).forEach(t => gradeTeachersMap.set(t.id, t));
        }

        // Return sorted by student views descending
        return Array.from(gradeTeachersMap.values()).sort((a, b) => (b.viewsCount || 0) - (a.viewsCount || 0));
    }

    // ==========================================
    // CONTENT CRUD (VIDEOS, QUIZZES, MALZAMAS)
    // ==========================================
    getAllVideos(onlyApproved = false, teacherId = null, includeAdminPending = false, filterLang = null) {
        try {
            let videos = JSON.parse(localStorage.getItem(this.STORAGE_KEY_VIDEOS) || '[]');
            if (filterLang) {
                videos = videos.filter(v => (v.lang || 'ku_ba') === filterLang);
            }
            if (onlyApproved) {
                videos = videos.filter(v => v.status === 'approved');
            } else if (teacherId) {
                videos = videos.filter(v => v.teacherId === teacherId);
            }
            return videos.sort((a, b) => (b.views || 0) - (a.views || 0));
        } catch (e) {
            return DEFAULT_VIDEOS;
        }
    }

    saveVideo(videoData) {
        const videos = JSON.parse(localStorage.getItem(this.STORAGE_KEY_VIDEOS) || '[]');
        const isSuperAdmin = this.isCurrentUserSuperAdmin();
        const activeLang = videoData.lang || this.getActiveLanguage();

        const newVideo = {
            id: videoData.id || 'v_' + Date.now(),
            teacherId: videoData.teacherId,
            teacherName: videoData.teacherName,
            grade: String(videoData.grade),
            subject: videoData.subject || 'کیمیا',
            chapter: videoData.chapter || '',
            title: videoData.title,
            youtubeUrl: videoData.youtubeUrl,
            views: videoData.views || 0,
            lang: activeLang,
            status: isSuperAdmin ? 'approved' : (videoData.status || 'pending'),
            createdAt: Date.now()
        };

        const existingIdx = videos.findIndex(v => v.id === newVideo.id);
        if (existingIdx >= 0) {
            videos[existingIdx] = newVideo;
        } else {
            videos.unshift(newVideo);
        }

        localStorage.setItem(this.STORAGE_KEY_VIDEOS, JSON.stringify(videos));

        if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length) {
            try {
                firebase.firestore().collection('educational_content').doc(newVideo.id).set({
                    ...newVideo,
                    type: 'video'
                }, { merge: true });
            } catch (e) {}
        }
        return newVideo;
    }

    getAllQuizzes(onlyApproved = false, teacherId = null, includeAdminPending = false, filterLang = null) {
        try {
            let quizzes = JSON.parse(localStorage.getItem(this.STORAGE_KEY_QUIZZES) || '[]');
            if (filterLang) {
                quizzes = quizzes.filter(q => (q.lang || 'ku_ba') === filterLang);
            }
            if (onlyApproved) {
                quizzes = quizzes.filter(q => q.status === 'approved');
            } else if (teacherId) {
                quizzes = quizzes.filter(q => q.teacherId === teacherId);
            }
            return quizzes.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        } catch (e) {
            return DEFAULT_QUIZZES;
        }
    }

    saveQuiz(quizData) {
        const quizzes = JSON.parse(localStorage.getItem(this.STORAGE_KEY_QUIZZES) || '[]');
        const isSuperAdmin = this.isCurrentUserSuperAdmin();
        const activeLang = quizData.lang || this.getActiveLanguage();

        const newQuiz = {
            id: quizData.id || 'q_' + Date.now(),
            teacherId: quizData.teacherId,
            teacherName: quizData.teacherName,
            grade: String(quizData.grade),
            subject: quizData.subject || 'کیمیا',
            chapter: quizData.chapter || '',
            question: quizData.question,
            options: quizData.options,
            correctIndex: quizData.correctIndex,
            explanation: quizData.explanation || '',
            lang: activeLang,
            status: isSuperAdmin ? 'approved' : (quizData.status || 'pending'),
            createdAt: Date.now()
        };

        const existingIdx = quizzes.findIndex(q => q.id === newQuiz.id);
        if (existingIdx >= 0) {
            quizzes[existingIdx] = newQuiz;
        } else {
            quizzes.unshift(newQuiz);
        }

        localStorage.setItem(this.STORAGE_KEY_QUIZZES, JSON.stringify(quizzes));

        if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length) {
            try {
                firebase.firestore().collection('educational_content').doc(newQuiz.id).set({
                    ...newQuiz,
                    type: 'quiz'
                }, { merge: true });
            } catch (e) {}
        }
        return newQuiz;
    }

    getAllMalzamas(onlyApproved = false, teacherId = null, includeAdminPending = false, filterLang = null) {
        try {
            let malzamas = JSON.parse(localStorage.getItem(this.STORAGE_KEY_MALZAMAS) || '[]');
            if (filterLang) {
                malzamas = malzamas.filter(m => (m.lang || 'ku_ba') === filterLang);
            }
            if (onlyApproved) {
                malzamas = malzamas.filter(m => m.status === 'approved');
            } else if (teacherId) {
                malzamas = malzamas.filter(m => m.teacherId === teacherId);
            }
            return malzamas.sort((a, b) => (b.views || 0) - (a.views || 0));
        } catch (e) {
            return DEFAULT_MALZAMAS;
        }
    }

    saveMalzama(malzamaData) {
        const malzamas = JSON.parse(localStorage.getItem(this.STORAGE_KEY_MALZAMAS) || '[]');
        const isSuperAdmin = this.isCurrentUserSuperAdmin();
        const activeLang = malzamaData.lang || this.getActiveLanguage();

        const newMalzama = {
            id: malzamaData.id || 'm_' + Date.now(),
            teacherId: malzamaData.teacherId,
            teacherName: malzamaData.teacherName,
            grade: String(malzamaData.grade),
            subject: malzamaData.subject || 'کیمیا',
            chapter: malzamaData.chapter || '',
            title: malzamaData.title,
            fileType: malzamaData.fileType || 'pdf', // 'pptx', 'html', 'image', 'pdf'
            fileUrl: malzamaData.fileUrl || '',
            fileName: malzamaData.fileName || 'file',
            fileSize: malzamaData.fileSize || 'N/A',
            htmlContent: malzamaData.htmlContent || '',
            description: malzamaData.description || '',
            views: malzamaData.views || 0,
            lang: activeLang,
            status: isSuperAdmin ? 'approved' : (malzamaData.status || 'pending'),
            createdAt: Date.now()
        };

        const existingIdx = malzamas.findIndex(m => m.id === newMalzama.id);
        if (existingIdx >= 0) {
            malzamas[existingIdx] = newMalzama;
        } else {
            malzamas.unshift(newMalzama);
        }

        localStorage.setItem(this.STORAGE_KEY_MALZAMAS, JSON.stringify(malzamas));

        if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length) {
            try {
                firebase.firestore().collection('educational_content').doc(newMalzama.id).set({
                    ...newMalzama,
                    type: 'malzama'
                }, { merge: true });
            } catch (e) {}
        }
        return newMalzama;
    }

    deleteContent(id, type) {
        let storageKey = null;
        if (type === 'video') storageKey = this.STORAGE_KEY_VIDEOS;
        else if (type === 'quiz') storageKey = this.STORAGE_KEY_QUIZZES;
        else if (type === 'malzama') storageKey = this.STORAGE_KEY_MALZAMAS;

        if (!storageKey) return false;

        try {
            const list = JSON.parse(localStorage.getItem(storageKey) || '[]');
            const filtered = list.filter(item => item.id !== id);
            localStorage.setItem(storageKey, JSON.stringify(filtered));

            if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length) {
                firebase.firestore().collection('educational_content').doc(id).delete().catch(() => {});
            }
            return true;
        } catch (e) {
            return false;
        }
    }

    // ==========================================
    // ADMIN APPROVAL WORKFLOW
    // ==========================================
    getPendingSubmissions() {
        const videos = JSON.parse(localStorage.getItem(this.STORAGE_KEY_VIDEOS) || '[]').filter(v => v.status === 'pending');
        const quizzes = JSON.parse(localStorage.getItem(this.STORAGE_KEY_QUIZZES) || '[]').filter(q => q.status === 'pending');
        const malzamas = JSON.parse(localStorage.getItem(this.STORAGE_KEY_MALZAMAS) || '[]').filter(m => m.status === 'pending');

        return {
            videos,
            quizzes,
            malzamas,
            totalPending: videos.length + quizzes.length + malzamas.length
        };
    }

    approveSubmission(id, type) {
        let storageKey = null;
        if (type === 'video') storageKey = this.STORAGE_KEY_VIDEOS;
        else if (type === 'quiz') storageKey = this.STORAGE_KEY_QUIZZES;
        else if (type === 'malzama') storageKey = this.STORAGE_KEY_MALZAMAS;

        if (!storageKey) return false;

        const list = JSON.parse(localStorage.getItem(storageKey) || '[]');
        const idx = list.findIndex(item => item.id === id);
        if (idx >= 0) {
            list[idx].status = 'approved';
            localStorage.setItem(storageKey, JSON.stringify(list));

            if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length) {
                firebase.firestore().collection('educational_content').doc(id).update({
                    status: 'approved'
                }).catch(() => {});
            }
            return true;
        }
        return false;
    }

    rejectSubmission(id, type) {
        let storageKey = null;
        if (type === 'video') storageKey = this.STORAGE_KEY_VIDEOS;
        else if (type === 'quiz') storageKey = this.STORAGE_KEY_QUIZZES;
        else if (type === 'malzama') storageKey = this.STORAGE_KEY_MALZAMAS;

        if (!storageKey) return false;

        const list = JSON.parse(localStorage.getItem(storageKey) || '[]');
        const idx = list.findIndex(item => item.id === id);
        if (idx >= 0) {
            list[idx].status = 'rejected';
            localStorage.setItem(storageKey, JSON.stringify(list));

            if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length) {
                firebase.firestore().collection('educational_content').doc(id).update({
                    status: 'rejected'
                }).catch(() => {});
            }
            return true;
        }
        return false;
    }

    submitVideo(videoData) {
        return this.saveVideo(videoData);
    }

    submitQuiz(quizData) {
        return this.saveQuiz(quizData);
    }

    submitMalzama(malzamaData) {
        return this.saveMalzama(malzamaData);
    }

    getYoutubeId(url) {
        if (!url) return '';
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : '';
    }
}

// Global Singleton Export
window.CURRICULUM_SUBJECTS = CURRICULUM_SUBJECTS;
window.GRADES_CONFIG = GRADES_CONFIG;
window.SUPPORTED_LANGS = SUPPORTED_LANGS;
window.EducationalData = new EducationalDataStore();
window.SUPER_ADMIN_EMAIL = SUPER_ADMIN_EMAIL;
