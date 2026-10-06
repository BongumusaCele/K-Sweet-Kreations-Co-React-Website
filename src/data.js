export const money = n => new Intl.NumberFormat('en-ZA', {style:'currency',currency:'ZAR'}).format(n)
export const products = [
 {id:1,name:'Chocolate Luxe',category:'Cakes',price:360,servings:'10–12',size:'20 cm',image:'/images/chocolate.jpg',description:'Rich chocolate layers with silky chocolate frosting.',active:true},
 {id:2,name:'Berry Bliss',category:'Cakes',price:340,servings:'10–12',size:'20 cm',image:'/images/berry.jpg',description:'Fresh berries, delicate sponge and a little joy.',active:true},
 {id:3,name:'Celebration Vanilla',category:'Cakes',price:320,servings:'10–12',size:'20 cm',image:'/images/celebration.jpg',description:'Soft vanilla sponge for your special moment.',active:true},
 {id:4,name:'Pretty Little Cupcakes',category:'Cupcakes',price:180,servings:'6',size:'Box of 6',image:'/images/cupcakes.jpg',description:'Six little treats with a beautifully piped finish.',active:true},
 {id:5,name:'Chocolate Celebration',category:'Cakes',price:480,servings:'16–20',size:'25 cm',image:'/images/chocolate.jpg',description:'A bigger slice of chocolate joy for everyone.',active:true},
 {id:6,name:'Berry Dessert Cake',category:'Desserts',price:280,servings:'8',size:'15 cm',image:'/images/berry.jpg',description:'A berry-topped treat for a cosy get-together.',active:true},
 {id:7,name:'Party Cupcake Box',category:'Cupcakes',price:340,servings:'12',size:'Box of 12',image:'/images/cupcakes.jpg',description:'A dozen reasons to make someone smile.',active:true},
 {id:8,name:'Vanilla Petite',category:'Cakes',price:260,servings:'6–8',size:'15 cm',image:'/images/celebration.jpg',description:'A little celebration with a whole lot of heart.',active:true},
]

