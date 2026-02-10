import { Itinerary } from "../services/api-service";

export const MOCK_TOKYO_ITINERARY: Itinerary = {
    id: "mock-trip-tokyo",
    trip_title: "Techno-Traditional Tokyo",
    destination: "Tokyo, Japan",
    start_date: new Date().toISOString().split("T")[0],
    end_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    days: [
        {
            day_number: 1,
            theme_title: "Day 1: Neon Lights & Ancient Spirits",
            activities: [
                {
                    id: "act-1-1",
                    name: "Senso-ji Temple",
                    description: "Step back in time at Tokyo's oldest temple. Walk through the Thunder Gate and explore the Nakamise shopping street.",
                    start_time: "09:00",
                    duration_minutes: 90,
                    location_name: "Asakusa",
                    image_keyword: "sensoji temple",
                    image_url: "https://images.pexels.com/photos/1496192/pexels-photo-1496192.jpeg",
                },
                {
                    id: "act-1-2",
                    name: "Sushi Lunch at Tsukiji",
                    description: "Enjoy the freshest seafood at the famous Tsukiji Outer Market.",
                    start_time: "12:00",
                    duration_minutes: 60,
                    location_name: "Tsukiji Market",
                    image_keyword: "sushi tokyo",
                    image_url: "https://images.pexels.com/photos/357756/pexels-photo-357756.jpeg",
                },
                {
                    id: "act-1-3",
                    name: "TeamLab Planets",
                    description: "Immerse yourself in digital art where you walk barefoot through water and crystal lights.",
                    start_time: "15:00",
                    duration_minutes: 120,
                    location_name: "Toyosu",
                    image_keyword: "teamlab borderless",
                    image_url: "https://images.pexels.com/photos/4053610/pexels-photo-4053610.jpeg",
                },
                {
                    id: "act-1-4",
                    name: "Shibuya Crossing",
                    description: "Witness the world's busiest pedestrian crossing and grab a view from the Magnet by Shibuya 109 rooftop.",
                    start_time: "19:00",
                    duration_minutes: 60,
                    location_name: "Shibuya",
                    image_keyword: "shibuya crossing",
                    image_url: "https://images.pexels.com/photos/6859240/pexels-photo-6859240.jpeg",
                },
            ],
        },
        {
            day_number: 2,
            theme_title: "Day 2: Pop Culture & Harajuku Style",
            activities: [
                {
                    id: "act-2-1",
                    name: "Meiji Shrine",
                    description: "Find peace in the forested heart of Tokyo, dedicated to Emperor Meiji.",
                    start_time: "09:30",
                    duration_minutes: 90,
                    location_name: "Harajuku",
                    image_keyword: "meiji shrine",
                    image_url: "https://images.pexels.com/photos/2187605/pexels-photo-2187605.jpeg",
                },
                {
                    id: "act-2-2",
                    name: "Harajuku Shopping",
                    description: "Explore Takeshita Street for kawaii fashion and crazy crepes.",
                    start_time: "11:30",
                    duration_minutes: 120,
                    location_name: "Takeshita Street",
                    image_keyword: "harajuku",
                    image_url: "https://images.pexels.com/photos/3052028/pexels-photo-3052028.jpeg",
                },
                {
                    id: "act-2-3",
                    name: "Akihabara Electric Town",
                    description: "Dive into the world of anime, manga, and electronics.",
                    start_time: "15:00",
                    duration_minutes: 150,
                    location_name: "Akihabara",
                    image_keyword: "akihabara",
                    image_url: "https://images.pexels.com/photos/1108701/pexels-photo-1108701.jpeg",
                },
            ]
        },
        {
            day_number: 3,
            theme_title: "Day 3: Future Views & Roppongi Nights",
            activities: [
                {
                    id: "act-3-1",
                    name: "Mori Art Museum",
                    description: "Contemporary art with a view at the top of Roppongi Hills.",
                    start_time: "10:00",
                    duration_minutes: 120,
                    location_name: "Roppongi",
                    image_keyword: "art museum tokyo",
                    image_url: "https://images.pexels.com/photos/20967/pexels-photo.jpg",
                },
                {
                    id: "act-3-2",
                    name: "Tokyo Tower",
                    description: "Visit the iconic red and white communication tower inspired by the Eiffel Tower.",
                    start_time: "14:00",
                    duration_minutes: 90,
                    location_name: "Minato",
                    image_keyword: "tokyo tower",
                    image_url: "https://images.pexels.com/photos/208321/pexels-photo-208321.jpeg",
                },
            ]
        }
    ]
};
