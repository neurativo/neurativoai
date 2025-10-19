"use client";

import { useState } from 'react';

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const faqData: FAQItem[] = [
  // General Questions
  {
    question: "What is Neurativo?",
    answer: "Neurativo is an AI-powered learning platform that helps you create personalized quizzes, track your progress, and master any subject with intelligent learning that adapts to your pace.",
    category: "General"
  },
  {
    question: "How does the AI work?",
    answer: "Our AI uses advanced natural language processing to understand content and generate relevant, personalized learning materials. It analyzes your input and creates quizzes, flashcards, and study materials tailored to your learning style.",
    category: "General"
  },
  {
    question: "Is my data secure?",
    answer: "Yes! We use enterprise-grade security measures and encryption to protect your data and privacy. Your information is stored securely and never shared with third parties.",
    category: "General"
  },

  // Pricing & Plans
  {
    question: "Can I change plans anytime?",
    answer: "Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately and we'll prorate any billing differences.",
    category: "Pricing"
  },
  {
    question: "Is there a free trial?",
    answer: "Yes! Our Essential plan gives you full access to core features with generous usage limits to get started. No credit card required.",
    category: "Pricing"
  },
  {
    question: "Can I cancel anytime?",
    answer: "Absolutely! Cancel anytime with no questions asked. Your data remains accessible until your billing period ends.",
    category: "Pricing"
  },
  {
    question: "How does the currency conversion work?",
    answer: "We use real-time exchange rates to convert our USD pricing to your local currency. Rates are updated daily and you can switch currencies anytime.",
    category: "Pricing"
  },

  // Usage & Limits
  {
    question: "What happens if I exceed my limits?",
    answer: "We'll notify you when you're approaching your limits. You can upgrade your plan or wait for your usage to reset the next day/month.",
    category: "Usage"
  },
  {
    question: "What are the usage limits for each plan?",
    answer: "Essential: 3 daily quizzes, 50 monthly quizzes. Professional: 10 daily quizzes, 200 monthly quizzes. Mastery: 20 daily quizzes, 500 monthly quizzes. Innovation: Unlimited quizzes with advanced features.",
    category: "Usage"
  },

  // Payment Methods
  {
    question: "What payment methods do you accept?",
    answer: "We accept all major credit cards, PayPal, and cryptocurrency payments for maximum flexibility. All payments are processed securely through our payment partners.",
    category: "Payment"
  },
  {
    question: "How do I verify my payment?",
    answer: "After making a payment, upload a screenshot or receipt of your payment confirmation. Our admin team will review and approve it within 24 hours. You'll receive a notification once approved.",
    category: "Payment"
  },
  {
    question: "What if my payment is rejected?",
    answer: "If your payment is rejected, you'll receive an email with the reason. You can submit a new payment or contact support for assistance. Common reasons include unclear payment proof or incorrect amount.",
    category: "Payment"
  },

  // Features
  {
    question: "What types of quizzes can I create?",
    answer: "You can create multiple choice, true/false, fill-in-the-blank, and short answer quizzes. Our AI can generate questions from text, URLs, documents, or specific topics you provide.",
    category: "Features"
  },
  {
    question: "Can I import my own content?",
    answer: "Yes! You can upload documents, paste text, or provide URLs. Our AI will analyze the content and generate relevant quiz questions based on the material.",
    category: "Features"
  },
  {
    question: "Is there a mobile app?",
    answer: "Currently, Neurativo is a web-based platform that works perfectly on mobile browsers. We're working on dedicated mobile apps for iOS and Android.",
    category: "Features"
  },

  // Technical Support
  {
    question: "How do I get help?",
    answer: "You can contact our support team through the contact form on our website, or email us directly. We typically respond within 24 hours.",
    category: "Support"
  },
  {
    question: "What browsers are supported?",
    answer: "Neurativo works on all modern browsers including Chrome, Firefox, Safari, and Edge. We recommend using the latest version for the best experience.",
    category: "Support"
  },
  {
    question: "Do you offer refunds?",
    answer: "Yes, we offer a 30-day money-back guarantee. If you're not satisfied with our service, contact us within 30 days of your purchase for a full refund.",
    category: "Support"
  }
];

const categories = ["All", "General", "Pricing", "Usage", "Payment", "Features", "Support"];

export default function FAQPage() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [openItems, setOpenItems] = useState<Set<number>>(new Set());

  const filteredFAQs = faqData.filter(faq => {
    const matchesCategory = selectedCategory === "All" || faq.category === selectedCategory;
    const matchesSearch = faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const toggleItem = (index: number) => {
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(index)) {
      newOpenItems.delete(index);
    } else {
      newOpenItems.add(index);
    }
    setOpenItems(newOpenItems);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      {/* Header */}
      <section className="py-20 bg-gradient-to-r from-purple-900/20 to-blue-900/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6">
            Frequently Asked <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">Questions</span>
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Find answers to common questions about Neurativo's AI-powered learning platform
          </p>
        </div>
      </section>

      {/* Search and Filter */}
      <section className="py-8 bg-black/20 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search FAQs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400/50"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <i className="fas fa-search text-gray-400"></i>
                </div>
              </div>
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedCategory === category
                      ? 'bg-purple-600 text-white'
                      : 'bg-white/10 text-gray-300 hover:bg-white/20'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Items */}
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-4">
            {filteredFAQs.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold text-white mb-2">No FAQs found</h3>
                <p className="text-gray-400">Try adjusting your search terms or category filter</p>
              </div>
            ) : (
              filteredFAQs.map((faq, index) => (
                <div
                  key={index}
                  className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden transition-all duration-200 hover:border-white/20"
                >
                  <button
                    onClick={() => toggleItem(index)}
                    className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-white/5 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="px-2 py-1 bg-purple-600/20 text-purple-300 text-xs rounded-full">
                          {faq.category}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-white">{faq.question}</h3>
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      <i className={`fas fa-chevron-down text-gray-400 transition-transform duration-200 ${
                        openItems.has(index) ? 'rotate-180' : ''
                      }`}></i>
                    </div>
                  </button>
                  
                  {openItems.has(index) && (
                    <div className="px-6 pb-4 border-t border-white/10">
                      <p className="text-gray-300 leading-relaxed pt-4">{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-16 bg-gradient-to-r from-purple-900/20 to-blue-900/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Still have questions?</h2>
          <p className="text-gray-300 mb-8">
            Can't find what you're looking for? Our support team is here to help!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/contact"
              className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-200 transform hover:scale-105"
            >
              Contact Support
            </a>
            <a
              href="/pricing"
              className="px-8 py-3 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-xl border border-white/20 hover:bg-white/20 transition-all duration-200"
            >
              View Pricing
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
