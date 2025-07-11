from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
from dotenv import load_dotenv
import requests
from bs4 import BeautifulSoup
import json
import uuid
from typing import List, Dict, Any
import asyncio
from urllib.parse import urljoin, urlparse
import re
from emergentintegrations.llm.chat import LlmChat, UserMessage

# Load environment variables
load_dotenv()

app = FastAPI()

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request models
class WebsiteAnalysisRequest(BaseModel):
    url: str

class WebsiteAnalysisResponse(BaseModel):
    url: str
    analysis_id: str
    title: str
    description: str
    content_summary: str
    suggestions: List[Dict[str, Any]]
    tools_recommended: List[Dict[str, Any]]
    overall_score: int
    categories: Dict[str, Any]
    meta_analysis: Dict[str, Any]  # New field for meta title/description analysis
    ai_tools_integration: List[Dict[str, Any]]  # New field for AI tools recommendations

# Gemini API configuration
GEMINI_API_KEY = "AIzaSyBf0atXh4HUKQYThHBHKzMUdVrW50chIfA"

class WebsiteAnalyzer:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        })
    
    def extract_website_content(self, url: str) -> Dict[str, Any]:
        """Extract comprehensive content from a website"""
        try:
            # Basic URL validation
            from urllib.parse import urlparse
            parsed_url = urlparse(url)
            if not parsed_url.scheme or not parsed_url.netloc:
                raise HTTPException(status_code=400, detail="Invalid URL format")
            
            if parsed_url.scheme not in ['http', 'https']:
                raise HTTPException(status_code=400, detail="URL must start with http:// or https://")
            
            response = self.session.get(url, timeout=30)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Extract basic info
            title = soup.find('title').text.strip() if soup.find('title') else 'No Title'
            description = ''
            meta_desc = soup.find('meta', attrs={'name': 'description'})
            if meta_desc:
                description = meta_desc.get('content', '')
            
            # Extract text content
            for script in soup(["script", "style"]):
                script.decompose()
            
            text_content = soup.get_text()
            lines = (line.strip() for line in text_content.splitlines())
            chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
            text = ' '.join(chunk for chunk in chunks if chunk)
            
            # Extract structural elements
            headings = {
                'h1': [h.get_text().strip() for h in soup.find_all('h1')],
                'h2': [h.get_text().strip() for h in soup.find_all('h2')],
                'h3': [h.get_text().strip() for h in soup.find_all('h3')]
            }
            
            # Extract links
            links = []
            for link in soup.find_all('a', href=True):
                href = link['href']
                if href.startswith('http') or href.startswith('/'):
                    links.append({
                        'url': href,
                        'text': link.get_text().strip()
                    })
            
            # Extract images
            images = []
            for img in soup.find_all('img'):
                src = img.get('src', '')
                alt = img.get('alt', '')
                if src:
                    images.append({
                        'src': src,
                        'alt': alt
                    })
            
            # Extract meta tags with more detail
            meta_tags = {}
            meta_title = title  # Use page title as fallback
            meta_description = description
            
            for meta in soup.find_all('meta'):
                name = meta.get('name') or meta.get('property')
                content = meta.get('content')
                if name and content:
                    meta_tags[name] = content
                    
                    # Extract specific meta tags for analysis
                    if name.lower() == 'description':
                        meta_description = content
                    elif name.lower() in ['og:title', 'twitter:title']:
                        meta_title = content
            
            # Extract additional SEO-related elements
            canonical_url = ''
            canonical_tag = soup.find('link', rel='canonical')
            if canonical_tag:
                canonical_url = canonical_tag.get('href', '')
            
            # Extract schema markup
            schema_scripts = soup.find_all('script', type='application/ld+json')
            schema_data = []
            for script in schema_scripts:
                try:
                    schema_data.append(json.loads(script.string))
                except:
                    pass
            
            # Basic performance indicators
            page_size = len(response.content)
            load_time = response.elapsed.total_seconds()
            
            return {
                'title': title,
                'description': description,
                'meta_title': meta_title,
                'meta_description': meta_description,
                'text_content': text[:10000],  # Limit content for API
                'headings': headings,
                'links_count': len(links),
                'images_count': len(images),
                'meta_tags': meta_tags,
                'canonical_url': canonical_url,
                'schema_data': schema_data,
                'page_size': page_size,
                'load_time': load_time,
                'status_code': response.status_code,
                'url': url
            }
            
        except HTTPException:
            raise
        except requests.exceptions.RequestException as e:
            raise HTTPException(status_code=400, detail=f"Unable to access website: {str(e)}")
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Error extracting content: {str(e)}")
    
    async def analyze_with_gemini(self, website_data: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze website content using Gemini AI"""
        try:
            # Create analysis prompt with better structure
            analysis_prompt = f"""
            You are a professional website analysis expert. Analyze the following website and provide specific, actionable improvement recommendations including meta title/description analysis and AI tool integration suggestions.

            Website Details:
            - URL: {website_data['url']}
            - Page Title: {website_data['title']}
            - Meta Title: {website_data.get('meta_title', 'Not found')}
            - Meta Description: {website_data.get('meta_description', 'Not found')}
            - Page Size: {website_data['page_size']} bytes
            - Load Time: {website_data['load_time']} seconds
            - H1 Tags: {website_data['headings'].get('h1', [])}
            - H2 Tags: {website_data['headings'].get('h2', [])[:5]}
            - Links: {website_data['links_count']} links
            - Images: {website_data['images_count']} images
            - Canonical URL: {website_data.get('canonical_url', 'Not found')}
            - Schema Data: {len(website_data.get('schema_data', []))} structured data items
            - Meta Tags: {json.dumps(website_data.get('meta_tags', {}), indent=2)}
            
            Content Sample: {website_data['text_content'][:2000]}

            IMPORTANT: Return ONLY valid JSON in the exact format below. Do not include any text before or after the JSON.

            {{
                "overall_score": 75,
                "content_summary": "Brief 2-3 sentence summary of what this website does and its main purpose",
                "suggestions": [
                    {{
                        "category": "SEO",
                        "title": "Improve Meta Description",
                        "description": "Add compelling meta descriptions to improve search engine visibility",
                        "priority": "High",
                        "impact": "High",
                        "effort": "Low"
                    }},
                    {{
                        "category": "Performance",
                        "title": "Optimize Page Load Speed",
                        "description": "Reduce page load time by compressing images and minifying CSS/JS",
                        "priority": "High",
                        "impact": "High",
                        "effort": "Medium"
                    }},
                    {{
                        "category": "UX",
                        "title": "Improve Navigation",
                        "description": "Make navigation more intuitive and user-friendly",
                        "priority": "Medium",
                        "impact": "Medium",
                        "effort": "Medium"
                    }},
                    {{
                        "category": "Content",
                        "title": "Enhance Content Quality",
                        "description": "Improve content clarity and add more valuable information",
                        "priority": "Medium",
                        "impact": "Medium",
                        "effort": "High"
                    }},
                    {{
                        "category": "Technical",
                        "title": "Fix Technical Issues",
                        "description": "Address any technical issues found on the website",
                        "priority": "High",
                        "impact": "High",
                        "effort": "Medium"
                    }}
                ],
                "tools_recommended": [
                    {{
                        "category": "SEO",
                        "tool_name": "Google Search Console",
                        "description": "Monitor search performance and fix SEO issues",
                        "use_case": "Track keyword rankings and crawl errors"
                    }},
                    {{
                        "category": "Performance",
                        "tool_name": "GTmetrix",
                        "description": "Analyze page speed and get optimization suggestions",
                        "use_case": "Identify performance bottlenecks and optimization opportunities"
                    }},
                    {{
                        "category": "UX",
                        "tool_name": "Google Analytics",
                        "description": "Track user behavior and identify UX issues",
                        "use_case": "Analyze user flow and identify drop-off points"
                    }},
                    {{
                        "category": "Content",
                        "tool_name": "Grammarly",
                        "description": "Improve content quality and readability",
                        "use_case": "Fix grammar and improve content clarity"
                    }}
                ],
                "meta_analysis": {{
                    "current_meta_title": "Current meta title from the website",
                    "current_meta_description": "Current meta description from the website",
                    "meta_title_analysis": {{
                        "length": 60,
                        "seo_score": 75,
                        "issues": ["Too long", "Missing keywords"],
                        "suggestions": "Make it more concise and include primary keywords"
                    }},
                    "meta_description_analysis": {{
                        "length": 155,
                        "seo_score": 80,
                        "issues": ["Missing call-to-action"],
                        "suggestions": "Add a compelling call-to-action at the end"
                    }},
                    "seo_strategy_insights": [
                        "This website focuses on informational content targeting long-tail keywords",
                        "The meta descriptions are optimized for click-through rates",
                        "Primary keyword strategy appears to be around [specific topic]"
                    ],
                    "recommended_meta_title": "Optimized Meta Title Example - Brand Name",
                    "recommended_meta_description": "Optimized meta description example that includes primary keywords and compelling call-to-action within 155 characters."
                }},
                "ai_tools_integration": [
                    {{
                        "category": "Customer Support",
                        "tool_name": "Chatbot Integration",
                        "description": "AI-powered chatbot for instant customer support",
                        "integration_complexity": "Medium",
                        "expected_impact": "High",
                        "use_case": "Reduce support tickets by 40% and improve response times",
                        "implementation_steps": [
                            "Choose chatbot platform (Intercom, Zendesk, or custom)",
                            "Train AI model with FAQ data",
                            "Integrate with existing support systems",
                            "Test and optimize responses"
                        ]
                    }},
                    {{
                        "category": "Personalization",
                        "tool_name": "Content Personalization Engine",
                        "description": "AI-driven content personalization based on user behavior",
                        "integration_complexity": "High",
                        "expected_impact": "High",
                        "use_case": "Increase engagement by 30% through personalized content",
                        "implementation_steps": [
                            "Implement user tracking and analytics",
                            "Set up machine learning models",
                            "Create dynamic content system",
                            "A/B test personalization strategies"
                        ]
                    }},
                    {{
                        "category": "Search",
                        "tool_name": "Intelligent Search",
                        "description": "AI-powered search with natural language processing",
                        "integration_complexity": "Medium",
                        "expected_impact": "Medium",
                        "use_case": "Improve search accuracy and user experience",
                        "implementation_steps": [
                            "Implement search indexing system",
                            "Integrate NLP capabilities",
                            "Add search analytics",
                            "Optimize search results ranking"
                        ]
                    }},
                    {{
                        "category": "Analytics",
                        "tool_name": "Predictive Analytics",
                        "description": "AI-powered analytics for predicting user behavior",
                        "integration_complexity": "High",
                        "expected_impact": "High",
                        "use_case": "Predict user churn and optimize conversion funnels",
                        "implementation_steps": [
                            "Set up comprehensive data collection",
                            "Implement machine learning models",
                            "Create prediction dashboards",
                            "Integrate with marketing automation"
                        ]
                    }}
                ],
                "categories": {{
                    "seo": {{
                        "score": 78,
                        "key_issues": ["Missing meta description", "Poor heading structure"]
                    }},
                    "performance": {{
                        "score": 65,
                        "key_issues": ["Slow page load", "Large image sizes"]
                    }},
                    "ux": {{
                        "score": 72,
                        "key_issues": ["Poor navigation", "Low mobile responsiveness"]
                    }},
                    "content": {{
                        "score": 80,
                        "key_issues": ["Thin content", "Poor readability"]
                    }},
                    "technical": {{
                        "score": 75,
                        "key_issues": ["Missing SSL", "Broken links"]
                    }}
                }}
            }}

            Provide specific analysis of the actual meta title and description from the website. Analyze their SEO strategy based on the meta tags and content. Recommend relevant AI tools that would specifically benefit this type of website.
            """
            
            # Initialize Gemini chat
            chat = LlmChat(
                api_key=GEMINI_API_KEY,
                session_id=str(uuid.uuid4()),
                system_message="You are a website analysis expert. Return only valid JSON responses in the exact format requested, with no additional text before or after the JSON."
            ).with_model("gemini", "gemini-2.0-flash").with_max_tokens(4096)
            
            # Send message to Gemini
            user_message = UserMessage(text=analysis_prompt)
            response = await chat.send_message(user_message)
            
            # Clean the response (remove any markdown formatting)
            cleaned_response = response.strip()
            if cleaned_response.startswith('```json'):
                cleaned_response = cleaned_response[7:]
            if cleaned_response.endswith('```'):
                cleaned_response = cleaned_response[:-3]
            cleaned_response = cleaned_response.strip()
            
            # Parse JSON response
            try:
                analysis_data = json.loads(cleaned_response)
                
                # Validate required fields
                required_fields = ['overall_score', 'content_summary', 'suggestions', 'tools_recommended', 'categories']
                for field in required_fields:
                    if field not in analysis_data:
                        raise ValueError(f"Missing required field: {field}")
                
                return analysis_data
                
            except (json.JSONDecodeError, ValueError) as e:
                print(f"JSON parsing error: {e}")
                print(f"Response: {cleaned_response[:500]}...")
                
                # Return a more intelligent fallback based on actual website data
                base_score = 70
                if website_data['load_time'] > 5:
                    base_score -= 10
                if not website_data.get('description'):
                    base_score -= 5
                if len(website_data['headings'].get('h1', [])) == 0:
                    base_score -= 5
                
                return {
                    "overall_score": max(40, min(95, base_score)),
                    "content_summary": f"This website titled '{website_data['title']}' appears to be a {self._categorize_website(website_data)}. It has {website_data['links_count']} links and {website_data['images_count']} images.",
                    "suggestions": self._generate_basic_suggestions(website_data),
                    "tools_recommended": self._generate_basic_tools(website_data),
                    "meta_analysis": self._generate_meta_analysis(website_data),
                    "ai_tools_integration": self._generate_ai_tools_integration(website_data),
                    "categories": self._generate_category_scores(website_data)
                }
                
        except Exception as e:
            print(f"Error analyzing with Gemini: {e}")
            raise HTTPException(status_code=500, detail=f"Error analyzing with Gemini: {str(e)}")
    
    def _categorize_website(self, website_data: Dict[str, Any]) -> str:
        """Categorize website based on content"""
        title = website_data.get('title', '').lower()
        content = website_data.get('text_content', '').lower()
        
        if 'blog' in title or 'blog' in content:
            return 'blog or news website'
        elif 'shop' in title or 'buy' in content or 'cart' in content:
            return 'e-commerce website'
        elif 'about' in content and 'contact' in content:
            return 'business or corporate website'
        elif 'portfolio' in title or 'portfolio' in content:
            return 'portfolio website'
        else:
            return 'informational website'
    
    def _generate_basic_suggestions(self, website_data: Dict[str, Any]) -> List[Dict[str, str]]:
        """Generate basic suggestions based on website data"""
        suggestions = []
        
        # SEO suggestions
        if not website_data.get('description'):
            suggestions.append({
                "category": "SEO",
                "title": "Add Meta Description",
                "description": "Your website is missing a meta description. Add a compelling 150-160 character description to improve search engine visibility.",
                "priority": "High",
                "impact": "High",
                "effort": "Low"
            })
        
        if len(website_data['headings'].get('h1', [])) == 0:
            suggestions.append({
                "category": "SEO",
                "title": "Add H1 Tag",
                "description": "Your website is missing an H1 tag. Add a proper H1 tag to improve SEO and page structure.",
                "priority": "High",
                "impact": "High",
                "effort": "Low"
            })
        
        # Performance suggestions
        if website_data['load_time'] > 3:
            suggestions.append({
                "category": "Performance",
                "title": "Optimize Page Load Speed",
                "description": f"Your page loads in {website_data['load_time']:.2f} seconds. Optimize images and minify CSS/JS to improve performance.",
                "priority": "High",
                "impact": "High",
                "effort": "Medium"
            })
        
        if website_data['page_size'] > 1000000:  # 1MB
            suggestions.append({
                "category": "Performance",
                "title": "Reduce Page Size",
                "description": f"Your page size is {website_data['page_size'] / 1024:.1f}KB. Consider compressing images and optimizing resources.",
                "priority": "Medium",
                "impact": "Medium",
                "effort": "Medium"
            })
        
        # Default UX suggestion
        suggestions.append({
            "category": "UX",
            "title": "Improve User Experience",
            "description": "Consider improving navigation, readability, and overall user experience based on user feedback and testing.",
            "priority": "Medium",
            "impact": "Medium",
            "effort": "High"
        })
        
        return suggestions
    
    def _generate_basic_tools(self, website_data: Dict[str, Any]) -> List[Dict[str, str]]:
        """Generate basic tool recommendations"""
        return [
            {
                "category": "SEO",
                "tool_name": "Google Search Console",
                "description": "Monitor search performance and identify SEO issues",
                "use_case": "Track keyword rankings and fix crawl errors"
            },
            {
                "category": "Performance",
                "tool_name": "GTmetrix",
                "description": "Analyze page speed and get optimization suggestions",
                "use_case": "Identify performance bottlenecks and optimization opportunities"
            },
            {
                "category": "UX",
                "tool_name": "Google Analytics",
                "description": "Track user behavior and identify UX issues",
                "use_case": "Analyze user flow and identify drop-off points"
            },
            {
                "category": "Content",
                "tool_name": "Grammarly",
                "description": "Improve content quality and readability",
                "use_case": "Fix grammar and improve content clarity"
            }
        ]
    
    def _generate_meta_analysis(self, website_data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate meta title and description analysis"""
        meta_title = website_data.get('meta_title', website_data.get('title', 'No title'))
        meta_description = website_data.get('meta_description', '')
        
        # Analyze meta title
        title_length = len(meta_title)
        title_score = 80
        title_issues = []
        
        if title_length > 60:
            title_score -= 20
            title_issues.append("Too long (over 60 characters)")
        elif title_length < 30:
            title_score -= 10
            title_issues.append("Too short (under 30 characters)")
        
        if not any(word in meta_title.lower() for word in ['best', 'top', 'guide', 'how', 'what', 'why']):
            title_issues.append("Missing engaging keywords")
        
        # Analyze meta description
        desc_length = len(meta_description)
        desc_score = 70
        desc_issues = []
        
        if desc_length == 0:
            desc_score = 20
            desc_issues.append("Missing meta description")
        elif desc_length > 160:
            desc_score -= 20
            desc_issues.append("Too long (over 160 characters)")
        elif desc_length < 120:
            desc_score -= 10
            desc_issues.append("Too short (under 120 characters)")
        
        if meta_description and not any(word in meta_description.lower() for word in ['learn', 'discover', 'get', 'find', 'explore']):
            desc_issues.append("Missing call-to-action words")
        
        # Generate SEO strategy insights
        website_type = self._categorize_website(website_data)
        seo_insights = []
        
        if 'e-commerce' in website_type:
            seo_insights.append("E-commerce site focusing on product visibility and conversion optimization")
        elif 'blog' in website_type:
            seo_insights.append("Content-focused strategy targeting informational keywords")
        elif 'business' in website_type:
            seo_insights.append("Local SEO and service-based keyword strategy")
        else:
            seo_insights.append("General informational content strategy")
        
        if meta_description:
            seo_insights.append("Uses meta descriptions to improve click-through rates")
        
        # Generate recommendations
        recommended_title = f"Optimized {website_data.get('title', 'Website Title')} - Key Benefits"
        recommended_description = f"Discover {website_data.get('title', 'our website')} and learn how we can help you achieve your goals. Get started today!"
        
        return {
            "current_meta_title": meta_title,
            "current_meta_description": meta_description,
            "meta_title_analysis": {
                "length": title_length,
                "seo_score": max(20, min(100, title_score)),
                "issues": title_issues or ["No major issues detected"],
                "suggestions": "Include primary keywords and keep under 60 characters for optimal display"
            },
            "meta_description_analysis": {
                "length": desc_length,
                "seo_score": max(20, min(100, desc_score)),
                "issues": desc_issues or ["No major issues detected"],
                "suggestions": "Include compelling call-to-action and keep between 120-160 characters"
            },
            "seo_strategy_insights": seo_insights,
            "recommended_meta_title": recommended_title[:60],
            "recommended_meta_description": recommended_description[:160]
        }
    
    def _generate_ai_tools_integration(self, website_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generate AI tools integration recommendations"""
        website_type = self._categorize_website(website_data)
        ai_tools = []
        
        # Base AI tools for all websites
        ai_tools.append({
            "category": "Customer Support",
            "tool_name": "AI Chatbot Integration",
            "description": "Implement AI-powered chatbot for instant customer support and FAQ assistance",
            "integration_complexity": "Medium",
            "expected_impact": "High",
            "use_case": "Reduce support tickets by 40% and provide 24/7 customer assistance",
            "implementation_steps": [
                "Choose chatbot platform (Dialogflow, Microsoft Bot Framework, or Rasa)",
                "Train AI model with existing FAQ and support data",
                "Integrate with website using JavaScript widget",
                "Test and optimize conversation flows"
            ]
        })
        
        # Content personalization for all sites
        ai_tools.append({
            "category": "Personalization",
            "tool_name": "Content Personalization Engine",
            "description": "AI-driven content recommendations based on user behavior and preferences",
            "integration_complexity": "High",
            "expected_impact": "High",
            "use_case": "Increase user engagement by 30% through personalized content delivery",
            "implementation_steps": [
                "Implement user tracking and behavior analytics",
                "Set up machine learning recommendation system",
                "Create dynamic content delivery system",
                "A/B test personalization strategies"
            ]
        })
        
        # Website-specific AI tools
        if 'e-commerce' in website_type:
            ai_tools.append({
                "category": "E-commerce",
                "tool_name": "Product Recommendation AI",
                "description": "Smart product recommendations based on user behavior and purchase history",
                "integration_complexity": "Medium",
                "expected_impact": "High",
                "use_case": "Increase average order value by 25% with intelligent upselling",
                "implementation_steps": [
                    "Integrate with product catalog and user data",
                    "Implement collaborative filtering algorithms",
                    "Add recommendation widgets to product pages",
                    "Monitor and optimize recommendation performance"
                ]
            })
        elif 'blog' in website_type:
            ai_tools.append({
                "category": "Content",
                "tool_name": "AI Content Optimization",
                "description": "Automated content optimization and SEO enhancement using AI",
                "integration_complexity": "Medium",
                "expected_impact": "Medium",
                "use_case": "Improve content quality and search rankings automatically",
                "implementation_steps": [
                    "Integrate with content management system",
                    "Set up AI content analysis tools",
                    "Implement automated SEO suggestions",
                    "Monitor content performance metrics"
                ]
            })
        else:
            ai_tools.append({
                "category": "Analytics",
                "tool_name": "Predictive Analytics Dashboard",
                "description": "AI-powered analytics for predicting user behavior and business trends",
                "integration_complexity": "High",
                "expected_impact": "High",
                "use_case": "Predict user churn and optimize conversion funnels proactively",
                "implementation_steps": [
                    "Set up comprehensive data collection",
                    "Implement machine learning prediction models",
                    "Create real-time analytics dashboard",
                    "Integrate with marketing automation tools"
                ]
            })
        
        # Add intelligent search for content-heavy sites
        if website_data['links_count'] > 50:
            ai_tools.append({
                "category": "Search",
                "tool_name": "AI-Powered Site Search",
                "description": "Intelligent search with natural language processing and semantic understanding",
                "integration_complexity": "Medium",
                "expected_impact": "Medium",
                "use_case": "Improve search accuracy by 60% and reduce bounce rate from search results",
                "implementation_steps": [
                    "Implement search indexing system",
                    "Integrate NLP capabilities (Elasticsearch or Algolia)",
                    "Add search analytics and autocomplete",
                    "Optimize search results ranking with AI"
                ]
            })
        
        return ai_tools
    
    def _generate_category_scores(self, website_data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate category scores based on website data"""
        # SEO score
        seo_score = 70
        seo_issues = []
        if not website_data.get('description'):
            seo_score -= 15
            seo_issues.append("Missing meta description")
        if len(website_data['headings'].get('h1', [])) == 0:
            seo_score -= 10
            seo_issues.append("Missing H1 tag")
        if len(website_data['headings'].get('h1', [])) > 1:
            seo_score -= 5
            seo_issues.append("Multiple H1 tags")
        
        # Performance score
        perf_score = 80
        perf_issues = []
        if website_data['load_time'] > 3:
            perf_score -= 20
            perf_issues.append("Slow page load time")
        if website_data['page_size'] > 1000000:
            perf_score -= 15
            perf_issues.append("Large page size")
        
        # UX score (basic estimate)
        ux_score = 75
        ux_issues = ["Navigation assessment needed", "Mobile responsiveness check needed"]
        
        # Content score
        content_score = 70
        content_issues = []
        if len(website_data['text_content']) < 500:
            content_score -= 10
            content_issues.append("Thin content")
        if not website_data.get('description'):
            content_score -= 5
            content_issues.append("Missing content description")
        
        # Technical score
        tech_score = 75
        tech_issues = []
        if website_data['url'].startswith('http://'):
            tech_score -= 15
            tech_issues.append("Not using HTTPS")
        
        return {
            "seo": {
                "score": max(30, min(100, seo_score)),
                "key_issues": seo_issues or ["No major SEO issues detected"]
            },
            "performance": {
                "score": max(30, min(100, perf_score)),
                "key_issues": perf_issues or ["No major performance issues detected"]
            },
            "ux": {
                "score": max(30, min(100, ux_score)),
                "key_issues": ux_issues
            },
            "content": {
                "score": max(30, min(100, content_score)),
                "key_issues": content_issues or ["Content quality appears adequate"]
            },
            "technical": {
                "score": max(30, min(100, tech_score)),
                "key_issues": tech_issues or ["No major technical issues detected"]
            }
        }

# Initialize analyzer
analyzer = WebsiteAnalyzer()

@app.get("/")
async def root():
    return {"message": "Website Analysis Tool API"}

@app.post("/api/analyze", response_model=WebsiteAnalysisResponse)
async def analyze_website(request: WebsiteAnalysisRequest):
    """Analyze a website and provide improvement suggestions"""
    try:
        # Extract website content
        website_data = analyzer.extract_website_content(request.url)
        
        # Analyze with Gemini AI
        analysis_result = await analyzer.analyze_with_gemini(website_data)
        
        # Create response
        response = WebsiteAnalysisResponse(
            url=request.url,
            analysis_id=str(uuid.uuid4()),
            title=website_data['title'],
            description=website_data['description'],
            content_summary=analysis_result.get('content_summary', ''),
            suggestions=analysis_result.get('suggestions', []),
            tools_recommended=analysis_result.get('tools_recommended', []),
            overall_score=analysis_result.get('overall_score', 70),
            categories=analysis_result.get('categories', {}),
            meta_analysis=analysis_result.get('meta_analysis', {}),
            ai_tools_integration=analysis_result.get('ai_tools_integration', [])
        )
        
        return response
        
    except HTTPException as e:
        # Re-raise HTTP exceptions (these have proper status codes)
        raise e
    except Exception as e:
        # Log unexpected errors and return 500
        import traceback
        print(f"Unexpected error: {e}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "service": "website-analysis-api"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)