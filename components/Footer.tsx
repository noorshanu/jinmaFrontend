"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { 
  FaTwitter, 
  FaDiscord, 
  FaTelegram, 
  FaGithub,
  FaLinkedin,
  FaEnvelope
} from "react-icons/fa";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    product: [
      { label: "Trading", href: "/trade-home" },
      { label: "Dashboard", href: "/dashboard" },
      { label: "Referrals", href: "/dashboard/referrals" },
      { label: "Deposit", href: "/dashboard/deposit" },
    ],
    company: [
      { label: "About Us", href: "#About" },
      { label: "Contact", href: "#Contact" },
      { label: "Privacy Policy", href: "#" },
      { label: "Terms of Service", href: "#" },
    ],
    support: [
      { label: "Help Center", href: "#" },
      { label: "Documentation", href: "#" },
      { label: "API Docs", href: "#" },
      { label: "Status", href: "#" },
    ],
  };

  const socialLinks = [
    { icon: FaTwitter, href: "https://twitter.com", label: "Twitter", color: "hover:text-[#1DA1F2]" },
    { icon: FaDiscord, href: "https://discord.com", label: "Discord", color: "hover:text-[#5865F2]" },
    { icon: FaTelegram, href: "https://telegram.org", label: "Telegram", color: "hover:text-[#0088cc]" },
    { icon: FaGithub, href: "https://github.com", label: "GitHub", color: "hover:text-white" },
    { icon: FaLinkedin, href: "https://linkedin.com", label: "LinkedIn", color: "hover:text-[#0077b5]" },
  ];

  return (
    <footer className="relative border-t border-white/10 bg-black/40 backdrop-blur-xl">
      {/* Background gradient effect */}
      <div className="absolute inset-0 bg-gradient-to-t from-blue-500/5 via-transparent to-transparent pointer-events-none" />
      
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-2"
          >
            <Link href="/" className="flex items-center gap-2 group mb-4">
              <div className="h-6 w-6 rotate-180 bg-gradient-to-b from-zinc-200 to-zinc-500 clip-tri transition-transform duration-300 group-hover:rotate-0" />
              <span className="text-sm tracking-[0.35em] text-zinc-400 font-medium">
Jinma Marketplace
              </span>
            </Link>
            <p className="text-zinc-400 text-sm leading-relaxed mb-6 max-w-md">
              Your trusted platform for Jinma trading. Experience seamless transactions, 
              secure trading, and powerful tools to maximize your crypto potential.
            </p>
            
            {/* Social Links */}
            <div className="flex items-center gap-4">
              {socialLinks.map((social, index) => {
                const Icon = social.icon;
                return (
                  <motion.a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    initial={{ opacity: 0, scale: 0 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1, duration: 0.3 }}
                    whileHover={{ scale: 1.1, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className={`text-zinc-400 ${social.color} transition-all duration-300 p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20`}
                    aria-label={social.label}
                  >
                    <Icon size={20} />
                  </motion.a>
                );
              })}
            </div>
          </motion.div>

          {/* Product Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <h3 className="text-white font-semibold mb-4 text-sm tracking-wider uppercase">
              Product
            </h3>
            <ul className="space-y-3">
              {footerLinks.product.map((link, index) => (
                <motion.li
                  key={link.label}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                >
                  <Link
                    href={link.href}
                    className="text-zinc-400 hover:text-white transition-colors duration-300 text-sm group flex items-center gap-2"
                  >
                    <span className="w-0 h-0.5 bg-gradient-to-r from-blue-400 to-cyan-300 transition-all duration-300 group-hover:w-4" />
                    {link.label}
                  </Link>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Company Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h3 className="text-white font-semibold mb-4 text-sm tracking-wider uppercase">
              Company
            </h3>
            <ul className="space-y-3">
              {footerLinks.company.map((link, index) => (
                <motion.li
                  key={link.label}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 + index * 0.05 }}
                >
                  <Link
                    href={link.href}
                    className="text-zinc-400 hover:text-white transition-colors duration-300 text-sm group flex items-center gap-2"
                  >
                    <span className="w-0 h-0.5 bg-gradient-to-r from-blue-400 to-cyan-300 transition-all duration-300 group-hover:w-4" />
                    {link.label}
                  </Link>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Support Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <h3 className="text-white font-semibold mb-4 text-sm tracking-wider uppercase">
              Support
            </h3>
            <ul className="space-y-3">
              {footerLinks.support.map((link, index) => (
                <motion.li
                  key={link.label}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + index * 0.05 }}
                >
                  <Link
                    href={link.href}
                    className="text-zinc-400 hover:text-white transition-colors duration-300 text-sm group flex items-center gap-2"
                  >
                    <span className="w-0 h-0.5 bg-gradient-to-r from-blue-400 to-cyan-300 transition-all duration-300 group-hover:w-4" />
                    {link.label}
                  </Link>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* Newsletter Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-12 pt-8 border-t border-white/10"
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex-1">
              <h3 className="text-white font-semibold mb-2 text-sm tracking-wider uppercase">
                Stay Updated
              </h3>
              <p className="text-zinc-400 text-sm">
                Get the latest updates and trading insights delivered to your inbox.
              </p>
            </div>
            <form className="flex gap-3 w-full md:w-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 md:w-64 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300"
              />
              <motion.button
                type="submit"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn-primary rounded-xl px-6 py-3 font-medium transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/25 whitespace-nowrap"
              >
                Subscribe
              </motion.button>
            </form>
          </div>
        </motion.div>

        {/* Bottom Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-8 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4"
        >
          <p className="text-zinc-500 text-sm text-center md:text-left">
            © {currentYear} Jinma  All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-sm">
            <Link
              href="#"
              className="text-zinc-500 hover:text-white transition-colors duration-300"
            >
              Privacy
            </Link>
            <span className="text-zinc-700">•</span>
            <Link
              href="#"
              className="text-zinc-500 hover:text-white transition-colors duration-300"
            >
              Terms
            </Link>
            <span className="text-zinc-700">•</span>
            <Link
              href="#"
              className="text-zinc-500 hover:text-white transition-colors duration-300 flex items-center gap-1"
            >
              <FaEnvelope size={12} />
              Contact
            </Link>
          </div>
        </motion.div>
      </div>

      <style jsx>{`
        .clip-tri {
          clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
        }
      `}</style>
    </footer>
  );
};

export default Footer;
