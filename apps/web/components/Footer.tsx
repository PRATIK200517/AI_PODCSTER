import {
    Facebook, Twitter, Instagram, Youtube,
    Headphones, Heart, Mail, Phone, MapPin
} from 'lucide-react';

function Footer() {
    return (
        <footer className="bg-gradient-to-b from-gray-900 to-gray-950 border-t border-gray-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {/* Brand Column */}
                    <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                            <Headphones className="h-8 w-8 text-purple-500" />
                            <span className="text-2xl font-bold text-white">PodStream</span>
                        </div>
                        <p className="text-gray-400 text-sm">
                            The ultimate destination for podcast lovers. Discover, stream, and share your favorite audio content.
                        </p>
                        <div className="flex space-x-4">
                            <a href="#" className="text-gray-400 hover:text-purple-500 transition-colors">
                                <Facebook className="h-5 w-5" />
                            </a>
                            <a href="#" className="text-gray-400 hover:text-purple-500 transition-colors">
                                <Twitter className="h-5 w-5" />
                            </a>
                            <a href="#" className="text-gray-400 hover:text-purple-500 transition-colors">
                                <Instagram className="h-5 w-5" />
                            </a>
                            <a href="#" className="text-gray-400 hover:text-purple-500 transition-colors">
                                <Youtube className="h-5 w-5" />
                            </a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="text-white font-semibold text-lg mb-4">Quick Links</h3>
                        <ul className="space-y-2">
                            <li>
                                <a href="/discover" className="text-gray-400 hover:text-purple-400 transition-colors text-sm">
                                    Discover Podcasts
                                </a>
                            </li>
                            <li>
                                <a href="/trending" className="text-gray-400 hover:text-purple-400 transition-colors text-sm">
                                    Trending Now
                                </a>
                            </li>
                            <li>
                                <a href="/categories" className="text-gray-400 hover:text-purple-400 transition-colors text-sm">
                                    Browse Categories
                                </a>
                            </li>
                            <li>
                                <a href="/creators" className="text-gray-400 hover:text-purple-400 transition-colors text-sm">
                                    For Creators
                                </a>
                            </li>
                            <li>
                                <a href="/about" className="text-gray-400 hover:text-purple-400 transition-colors text-sm">
                                    About Us
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Categories */}
                    <div>
                        <h3 className="text-white font-semibold text-lg mb-4">Top Categories</h3>
                        <ul className="space-y-2">
                            <li>
                                <a href="/category/technology" className="text-gray-400 hover:text-purple-400 transition-colors text-sm">
                                    Technology
                                </a>
                            </li>
                            <li>
                                <a href="/category/business" className="text-gray-400 hover:text-purple-400 transition-colors text-sm">
                                    Business
                                </a>
                            </li>
                            <li>
                                <a href="/category/health" className="text-gray-400 hover:text-purple-400 transition-colors text-sm">
                                    Health & Wellness
                                </a>
                            </li>
                            <li>
                                <a href="/category/entertainment" className="text-gray-400 hover:text-purple-400 transition-colors text-sm">
                                    Entertainment
                                </a>
                            </li>
                            <li>
                                <a href="/category/education" className="text-gray-400 hover:text-purple-400 transition-colors text-sm">
                                    Education
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div>
                        <h3 className="text-white font-semibold text-lg mb-4">Contact Us</h3>
                        <ul className="space-y-3">
                            <li className="flex items-start space-x-3">
                                <Mail className="h-5 w-5 text-purple-500 mt-0.5" />
                                <span className="text-gray-400 text-sm">support@podstream.com</span>
                            </li>
                            <li className="flex items-start space-x-3">
                                <Phone className="h-5 w-5 text-purple-500 mt-0.5" />
                                <span className="text-gray-400 text-sm">+1 (555) 123-4567</span>
                            </li>
                            <li className="flex items-start space-x-3">
                                <MapPin className="h-5 w-5 text-purple-500 mt-0.5" />
                                <span className="text-gray-400 text-sm">123 Audio Street, San Francisco, CA</span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Newsletter Subscription */}
                <div className="mt-12 pt-8 border-t border-gray-800">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h3 className="text-white font-semibold text-lg mb-2">Stay Updated</h3>
                            <p className="text-gray-400 text-sm">
                                Subscribe to our newsletter for the latest podcast releases and updates.
                            </p>
                        </div>
                        <div className="flex-1 max-w-md">
                            <div className="flex">
                                <input
                                    type="email"
                                    placeholder="Enter your email"
                                    className="flex-1 bg-gray-800 border border-gray-700 text-white rounded-l-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                />
                                <button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-3 rounded-r-lg font-medium transition-all">
                                    Subscribe
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="mt-12 pt-8 border-t border-gray-800">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="text-gray-500 text-sm">
                            © {new Date().getFullYear()} PodStream. All rights reserved.
                        </div>
                        <div className="flex items-center space-x-6 text-gray-500 text-sm">
                            <a href="/privacy" className="hover:text-purple-400 transition-colors">
                                Privacy Policy
                            </a>
                            <a href="/terms" className="hover:text-purple-400 transition-colors">
                                Terms of Service
                            </a>
                            <a href="/cookies" className="hover:text-purple-400 transition-colors">
                                Cookie Policy
                            </a>
                        </div>
                    </div>

                    {/* Made with love */}
                    <div className="mt-6 flex items-center justify-center text-gray-500 text-sm">
                        <Heart className="h-4 w-4 text-red-500 mr-2" fill="currentColor" />
                        <span>Made with passion for podcast enthusiasts worldwide By Pratik More</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}

export default Footer