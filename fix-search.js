// Script to fix the search functionality
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function fixSearch() {
    console.log('🔧 Fixing search functionality...\n');
    
    try {
        const browser = await puppeteer.connect({
            browserURL: 'http://127.0.0.1:9222',
            defaultViewport: null
        });
        
        const pages = await browser.pages();
        const page = pages[0];
        
        console.log('📍 Navigating to home...');
        await page.goto('https://x.com/home', { waitUntil: 'networkidle2' });
        await page.waitForTimeout(3000);
        
        console.log('🔍 Looking for all possible search elements...\n');
        
        // Get all input elements
        const inputs = await page.evaluate(() => {
            const allInputs = document.querySelectorAll('input');
            const searchCandidates = [];
            
            allInputs.forEach((input, index) => {
                const info = {
                    index,
                    type: input.type,
                    placeholder: input.placeholder,
                    ariaLabel: input.getAttribute('aria-label'),
                    dataTestId: input.getAttribute('data-testid'),
                    className: input.className,
                    role: input.getAttribute('role'),
                    name: input.name
                };
                
                // Check if it might be a search input
                const searchKeywords = ['search', 'Search', 'query', 'find'];
                const isLikelySearch = searchKeywords.some(keyword => 
                    (info.placeholder && info.placeholder.includes(keyword)) ||
                    (info.ariaLabel && info.ariaLabel.includes(keyword)) ||
                    (info.className && info.className.includes(keyword))
                );
                
                if (isLikelySearch || info.type === 'search' || info.placeholder) {
                    searchCandidates.push(info);
                }
            });
            
            return searchCandidates;
        });
        
        console.log(`Found ${inputs.length} potential search inputs:\n`);
        inputs.forEach((input, i) => {
            console.log(`${i + 1}. Input:`);
            console.log(`   Type: ${input.type}`);
            console.log(`   Placeholder: ${input.placeholder || 'none'}`);
            console.log(`   Aria-label: ${input.ariaLabel || 'none'}`);
            console.log(`   Data-testid: ${input.dataTestId || 'none'}`);
            console.log(`   Class: ${input.className ? input.className.substring(0, 50) + '...' : 'none'}`);
            console.log('');
        });
        
        // Try to find the explore/search navigation
        console.log('🔍 Looking for Explore/Search navigation...\n');
        
        const navLinks = await page.evaluate(() => {
            const links = document.querySelectorAll('a[href*="/explore"], a[href*="/search"], nav a');
            const searchLinks = [];
            
            links.forEach(link => {
                const text = link.innerText || '';
                if (text.includes('Explore') || text.includes('Search')) {
                    searchLinks.push({
                        text: text,
                        href: link.href,
                        dataTestId: link.getAttribute('data-testid')
                    });
                }
            });
            
            return searchLinks;
        });
        
        console.log(`Found ${navLinks.length} explore/search links:`);
        navLinks.forEach(link => {
            console.log(`   "${link.text}" -> ${link.href}`);
        });
        
        // Click on Explore if found
        if (navLinks.length > 0) {
            console.log('\n📍 Clicking on Explore...');
            await page.click(`a[href="${navLinks[0].href.replace('https://x.com', '')}"]`);
            await page.waitForTimeout(3000);
            
            // Now check for search box again
            console.log('🔍 Checking for search box on Explore page...\n');
            
            const exploreInputs = await page.evaluate(() => {
                const inputs = document.querySelectorAll('input');
                const results = [];
                
                inputs.forEach(input => {
                    if (input.placeholder || input.getAttribute('aria-label')) {
                        results.push({
                            placeholder: input.placeholder,
                            ariaLabel: input.getAttribute('aria-label'),
                            dataTestId: input.getAttribute('data-testid'),
                            selector: input.placeholder ? `input[placeholder="${input.placeholder}"]` : 
                                     input.getAttribute('aria-label') ? `input[aria-label="${input.getAttribute('aria-label')}"]` :
                                     'unknown'
                        });
                    }
                });
                
                return results;
            });
            
            console.log('Found inputs on Explore page:');
            exploreInputs.forEach(input => {
                console.log(`   Selector: ${input.selector}`);
                console.log(`   Placeholder: ${input.placeholder || 'none'}`);
                console.log(`   Aria-label: ${input.ariaLabel || 'none'}\n`);
            });
        }
        
        console.log('✅ Search diagnostic complete!');
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

fixSearch().catch(console.error);