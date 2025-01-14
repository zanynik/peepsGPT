
import { db } from "./index";
import { users, matches } from "./schema";
import { sql } from "drizzle-orm";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

const crypto = {
  hash: async (password: string) => {
    const salt = randomBytes(16).toString("hex");
    const buf = (await scryptAsync(password, salt, 64)) as Buffer;
    return `${buf.toString("hex")}.${salt}`;
  }
};

const mbtiProfiles = [
  {
    type: "INTJ",
    name: "Alex Chen",
    username: "architect_alex",
    email: "alex.chen@example.com",
    age: 29,
    location: "Seattle, United States",
    latitude: "47.6062",
    longitude: "-122.3321",
    gender: "Other",
    publicDescription: "Strategic thinker and innovator. Driven by knowledge and improvement. Interested in complex systems and long-term planning. Known for developing innovative solutions and pushing boundaries in technology and science.",
    privateDescription: "Sometimes struggle with expressing emotions. Need lots of alone time to recharge. Perfectionist tendencies can be overwhelming. Often feel misunderstood due to direct communication style.",
  },
  {
    type: "INTP",
    name: "Sam Wright",
    username: "logician_sam",
    email: "sam.wright@example.com",
    age: 25,
    location: "Boston, United States",
    latitude: "42.3601",
    longitude: "-71.0589",
    gender: "Other",
    publicDescription: "Analytical problem-solver fascinated by theoretical concepts. Love exploring abstract ideas and finding logical inconsistencies. Always questioning assumptions and seeking deeper understanding.",
    privateDescription: "Often get lost in thoughts and forget practical matters. Struggle with deadlines and routine tasks. Can appear aloof when deeply focused on solving complex problems.",
  },
  {
    type: "ENTJ",
    name: "Morgan Lee",
    username: "commander_morgan",
    email: "morgan.lee@example.com",
    age: 32,
    location: "New York, United States",
    latitude: "40.7128",
    longitude: "-74.0060",
    gender: "Female",
    publicDescription: "Natural leader with a drive for efficiency and achievement. Expert at organizing people and resources. Strategic visionary focused on implementing long-term plans and achieving goals.",
    privateDescription: "Can be too demanding of others and self. Working on being more patient with different perspectives. Sometimes struggle with emotional situations and need to develop more empathy.",
  },
  {
    type: "ENTP",
    name: "Jordan Rivers",
    username: "debater_jordan",
    email: "jordan.rivers@example.com",
    age: 27,
    location: "San Francisco, United States",
    latitude: "37.7749",
    longitude: "-122.4194",
    gender: "Male",
    publicDescription: "Quick-witted and versatile thinker. Love challenging assumptions and sparking innovative discussions. Excellent at brainstorming and seeing possibilities others miss.",
    privateDescription: "Sometimes argue just for fun which can strain relationships. Need to work on following through with projects. Can be insensitive to others' feelings when caught up in debates.",
  },
  {
    type: "INFJ",
    name: "Luna Silva",
    username: "advocate_luna",
    email: "luna.silva@example.com",
    age: 31,
    location: "Portland, United States",
    latitude: "45.5155",
    longitude: "-122.6789",
    gender: "Female",
    publicDescription: "Idealistic and empathetic counselor. Dedicated to making positive changes in the world and understanding others deeply. Passionate about personal growth and helping others reach their potential.",
    privateDescription: "Often feel misunderstood and overwhelmed by others' emotions. Need to avoid taking on others' emotional burdens too much. Struggle with perfectionism and being too hard on self.",
  },
  {
    type: "INFP",
    name: "Kai Anderson",
    username: "mediator_kai",
    email: "kai.anderson@example.com",
    age: 24,
    location: "Austin, United States",
    latitude: "30.2672",
    longitude: "-97.7431",
    gender: "Other",
    publicDescription: "Creative soul seeking authentic connections. Passionate about personal growth and helping others find their path. Deeply interested in understanding human nature and creating meaningful art.",
    privateDescription: "Struggle with criticism and practical demands. Sometimes get lost in daydreams and ideals. Can be too perfectionist about creative projects and have trouble with deadlines.",
  },
  {
    type: "ENFJ",
    name: "Maya Patel",
    username: "protagonist_maya",
    email: "maya.patel@example.com",
    age: 30,
    location: "Chicago, United States",
    latitude: "41.8781",
    longitude: "-87.6298",
    gender: "Female",
    publicDescription: "Natural mentor and inspirational leader. Devoted to fostering growth in others. Excellent at reading people and bringing out their best potential. Passionate about community building.",
    privateDescription: "Can be too selfless and neglect own needs. Working on setting better boundaries. Sometimes take rejection of ideas too personally and need to separate self from work.",
  },
  {
    type: "ENFP",
    name: "Finn O'Connor",
    username: "champion_finn",
    email: "finn.oconnor@example.com",
    age: 26,
    location: "Denver, United States",
    latitude: "39.7392",
    longitude: "-104.9903",
    gender: "Male",
    publicDescription: "Enthusiastic explorer of ideas and possibilities. Love connecting with people and starting new projects. Natural at inspiring others and seeing potential in everything.",
    privateDescription: "Get easily distracted by new interests. Need to work on following through and staying organized. Can be overwhelmed by too many possibilities and struggle with decisions.",
  },
  {
    type: "ISTJ",
    name: "Grace Zhang",
    username: "logistician_grace",
    email: "grace.zhang@example.com",
    age: 34,
    location: "Washington, United States",
    latitude: "38.9072",
    longitude: "-77.0369",
    gender: "Female",
    publicDescription: "Reliable and systematic professional. Value tradition, order, and honest work. Excellent at maintaining systems and ensuring everything runs smoothly. Detail-oriented and trustworthy.",
    privateDescription: "Can be too rigid with rules and expectations. Working on adapting to change more easily. Sometimes struggle with expressing emotions and understanding others' feelings.",
  },
  {
    type: "ISFJ",
    name: "David Martinez",
    username: "defender_david",
    email: "david.martinez@example.com",
    age: 28,
    location: "Miami, United States",
    latitude: "25.7617",
    longitude: "-80.1918",
    gender: "Male",
    publicDescription: "Caring and dedicated protector. Committed to serving others and maintaining harmony. Excellent at remembering details about people and creating comfortable environments.",
    privateDescription: "Tendency to overextend and neglect self-care. Need to learn to say no sometimes. Can take criticism too personally and worry too much about others' opinions.",
  },
  {
    type: "ESTJ",
    name: "Emma Wilson",
    username: "executive_emma",
    email: "emma.wilson@example.com",
    age: 33,
    location: "Philadelphia, United States",
    latitude: "39.9526",
    longitude: "-75.1652",
    gender: "Female",
    publicDescription: "Natural organizer and decisive leader. Value clear structures and traditional methods. Excellent at implementing systems and maintaining order. Results-oriented and reliable.",
    privateDescription: "Can be too quick to judge and dismiss new ideas. Working on being more open to alternative approaches. Sometimes struggle with understanding emotional needs of others.",
  },
  {
    type: "ESFJ",
    name: "Marcus Johnson",
    username: "consul_marcus",
    email: "marcus.johnson@example.com",
    age: 29,
    location: "Atlanta, United States",
    latitude: "33.7490",
    longitude: "-84.3880",
    gender: "Male",
    publicDescription: "Caring and social, focused on creating harmony. Love helping others and building community. Excellent at organizing social events and maintaining traditions.",
    privateDescription: "Sometimes too sensitive to criticism. Need to work on not taking things personally. Can be too focused on social status and others' opinions.",
  },
  {
    type: "ISTP",
    name: "Raven Cruz",
    username: "virtuoso_raven",
    email: "raven.cruz@example.com",
    age: 27,
    location: "Las Vegas, United States",
    latitude: "36.1699",
    longitude: "-115.1398",
    gender: "Other",
    publicDescription: "Skilled troubleshooter with a knack for practical solutions. Love exploring how things work. Excellent at understanding mechanical and technical systems. Adventure-seeking and adaptable.",
    privateDescription: "Can be too detached from emotions. Need to work on long-term planning and commitment. Sometimes struggle with expressing feelings and maintaining close relationships.",
  },
  {
    type: "ISFP",
    name: "Noah Kim",
    username: "adventurer_noah",
    email: "noah.kim@example.com",
    age: 23,
    location: "Los Angeles, United States",
    latitude: "34.0522",
    longitude: "-118.2437",
    gender: "Male",
    publicDescription: "Artistic soul with a love for beauty and authenticity. Living in the moment and creating beautiful experiences. Excellent at bringing artistic vision to life.",
    privateDescription: "Struggle with confrontation and planning ahead. Need to work on being more assertive. Can be too sensitive to criticism and avoid necessary conflicts.",
  },
  {
    type: "ESTP",
    name: "Zoe Thompson",
    username: "entrepreneur_zoe",
    email: "zoe.thompson@example.com",
    age: 30,
    location: "Houston, United States",
    latitude: "29.7604",
    longitude: "-95.3698",
    gender: "Female",
    publicDescription: "Action-oriented thrill-seeker. Love taking risks and solving immediate challenges. Natural entrepreneur with excellent situational awareness. Always ready for adventure.",
    privateDescription: "Can be impulsive and overlook long-term consequences. Working on patience and planning. Sometimes struggle with commitment and following through on long-term projects.",
  },
  {
    type: "ESFP",
    name: "Leo Santos",
    username: "entertainer_leo",
    email: "leo.santos@example.com",
    age: 25,
    location: "Orlando, United States",
    latitude: "28.5383",
    longitude: "-81.3792",
    gender: "Male",
    publicDescription: "Spontaneous entertainer with a zest for life. Love bringing joy to others and living in the moment. Natural performer who excels at making life fun and exciting.",
    privateDescription: "Sometimes avoid serious discussions and responsibilities. Need to work on focus and discipline. Can be too focused on immediate pleasures and avoid planning for the future.",
  },
];

async function seed() {
  try {
    // Clear existing matches first
    await db.delete(matches);
    // Then clear existing users
    await db.delete(users);
    
    // Insert new users
    for (const profile of mbtiProfiles) {
      const hashedPassword = await crypto.hash("password123");
      await db.insert(users).values({
        ...profile,
        password: hashedPassword,
        photoUrl: `https://api.dicebear.com/7.x/personas/svg?seed=${profile.username}`,
        socialIds: `twitter:@${profile.username}`,
        newsletterEnabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    
    console.log("Database seeded successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}

seed();
