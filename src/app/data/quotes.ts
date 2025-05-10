export interface Quote {
    text: string;
    author: string;
    categories: string[];
}

export const quotes: Quote[] = [
    {
        text: "Be the change you wish to see in the world.",
        author: "Mahatma Gandhi",
        categories: ["inspirational", "mindfulness"]
    },
    {
        text: "Success is not final, failure is not fatal: it is the courage to continue that counts.",
        author: "Winston Churchill",
        categories: ["inspirational", "work"]
    },
    {
        text: "Two things are infinite: the universe and human stupidity; and I'm not sure about the universe.",
        author: "Albert Einstein",
        categories: ["humor", "wisdom"]
    },
    {
        text: "Love all, trust a few, do wrong to none.",
        author: "William Shakespeare",
        categories: ["love", "wisdom"]
    },
    {
        text: "Creativity is intelligence having fun.",
        author: "Albert Einstein",
        categories: ["work", "humor"]
    },
    {
        text: "The present moment is filled with joy and happiness. If you are attentive, you will see it.",
        author: "Thich Nhat Hanh",
        categories: ["mindfulness", "wisdom"]
    }
];

export const quoteCategories = [
    { value: "all", label: "All Quotes" },
    { value: "inspirational", label: "Inspirational & Motivational" },
    { value: "wisdom", label: "Wisdom & Philosophy" },
    { value: "humor", label: "Humor" },
    { value: "love", label: "Love & Relationships" },
    { value: "work", label: "Work & Creativity" },
    { value: "mindfulness", label: "Mindfulness & Spirituality" }
]; 