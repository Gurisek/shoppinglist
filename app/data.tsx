const data = [
    {
        id: 1,
        title: "Týdenní nákup",
        ownerName: "Roman",
        items: [
            { name: "Mléko", quantity: 2, resolved: false },
            { name: "Chléb", quantity: 1, resolved: true },
            { name: "Máslo", quantity: 1, resolved: false },
        ],
        completed: false,
    },
    {
        id: 2,
        title: "Grilování v neděli",
        ownerName: "Petra",
        items: [
            { name: "Kuřecí steaky", quantity: 6, resolved: false },
            { name: "Papriky", quantity: 4, resolved: true },
            { name: "Olivový olej", quantity: 1, resolved: false },
        ],
        completed: false,
    },
    {
        id: 3,
        title: "Základní zásoby",
        ownerName: "Jana",
        items: [
            { name: "Rýže", quantity: 2, resolved: true },
            { name: "Těstoviny", quantity: 3, resolved: true },
            { name: "Sůl", quantity: 1, resolved: true },
        ],
        completed: true,
    },
];

export default data;
