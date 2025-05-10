export interface Quote {
    text: string;
    author: string;
    categories: string[];
}

export const quotes: Quote[] = [
    {
        text: "Be the change you wish to see in the world.",
        author: "Mahatma Gandhi",
        categories: ["inspiration", "change"]
    },
    {
        text: "Two things are infinite: the universe and human stupidity; and I'm not sure about the universe.",
        author: "Albert Einstein",
        categories: ["humor", "science"]
    },
    // Add more quotes here...
];

export const quoteCategories = [
    { value: "all", label: "All Quotes" },
    { value: "inspiration", label: "Inspiration" },
    { value: "humor", label: "Humor" },
    { value: "science", label: "Science" },
    // Add more categories...
]; 