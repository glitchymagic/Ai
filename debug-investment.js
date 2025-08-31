const AuthorityResponses = require('./features/authority-responses');

const authorityResponses = new AuthorityResponses();

const text = "Is it worth investing in sealed Pokemon products for long term holds?";
const textLower = text.toLowerCase();

console.log('Text:', text);
console.log('Lowercase:', textLower);
console.log('Contains "invest":', textLower.includes('invest'));
console.log('Contains "sealed":', textLower.includes('sealed'));
console.log('Contains "pokemon":', textLower.includes('pokemon'));

console.log('\nIs investment question?', authorityResponses.isInvestmentQuestion(textLower));
console.log('Is market discussion?', authorityResponses.isMarketDiscussion(textLower));

const response = authorityResponses.generateAuthorityResponse(text, false);
console.log('Response:', response);