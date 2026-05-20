/**
 * Official MCAET details — https://mcaet.vercel.app/
 */
export const COLLEGE = {
  shortName: 'MCAET',
  fullName: 'Mahamaya College of Agricultural Engineering & Technology',
  libraryName: 'MCAET Central Library',
  appName: 'MCAET Library',
  tagline: 'Akbarpur, Ambedkar Nagar',
  pincode: '224122',
  state: 'Uttar Pradesh',
  address:
    'Mahamaya College of Agricultural Engineering & Technology, Akbarpur, Ambedkar Nagar, 224122 (U.P.)',
  addressLine:
    'Mahamaya College Of Agricultural Engineering & Technology, Akbarpur, Ambedkar Nagar, 224122 (U.P.)',
  university: 'Acharya Narendra Deva University of Agriculture & Technology',
  universityShort: 'ANDUAT',
  universityLocation: 'Kumarganj, Ayodhya',
  established: 2002,
  phone: '+91 90766 11211',
  phoneTel: 'tel:+919076611211',
  email: 'deanmcaet@gmail.com',
  emailMailto: 'mailto:deanmcaet@gmail.com',
  website: 'https://mcaet.vercel.app/',
  websiteDisplay: 'mcaet.vercel.app',
  dean: 'Dr. N.C. Shahi',
  governmentBadge: 'Government of Uttar Pradesh',
} as const;

export const COLLEGE_HIGHLIGHTS = [
  {
    emoji: '🏛️',
    title: 'Government College',
    desc: `Constituent college under ${COLLEGE.universityShort}, ${COLLEGE.universityLocation}`,
  },
  {
    emoji: '🌾',
    title: 'Agricultural Engineering',
    desc: 'B.Tech in Agricultural, Mechanical & Computer Science Engineering',
  },
  {
    emoji: '🔬',
    title: 'M.Tech & Ph.D.',
    desc: 'Postgraduate programmes in agri-engineering disciplines',
  },
  {
    emoji: '📚',
    title: 'Central Library',
    desc: 'Digital catalog, rack search & book issue management',
  },
] as const;

export const COLLEGE_ABOUT = [
  `${COLLEGE.fullName} (${COLLEGE.shortName}) is a government engineering college at Akbarpur, Ambedkar Nagar, Uttar Pradesh. Established in ${COLLEGE.established}, it is a constituent college of ${COLLEGE.university} (${COLLEGE.universityShort}), ${COLLEGE.universityLocation}.`,
  'The college offers B.Tech in Agricultural Engineering, Mechanical Engineering, and Computer Science & Engineering. Postgraduate programmes include Soil & Water Conservation, Irrigation & Drainage, Farm Machinery & Power, Processing & Food Engineering, and Renewable Energy Engineering.',
  `${COLLEGE.shortName} is affiliated with ICAR, approved by AICTE, and is committed to skilled engineers for farming communities and rural development of Uttar Pradesh.`,
] as const;

export const LIBRARY_ABOUT =
  'The MCAET Central Library supports undergraduate and postgraduate programmes in agricultural and allied engineering. Our collection includes core textbooks across FMPE, PFE, SWCE, IDE, REE, CSE, BEAS, and related disciplines — all catalogued digitally for students and faculty.';
