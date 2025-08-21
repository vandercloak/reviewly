import { motion } from 'framer-motion'

export function GlowCard({ children, className = "", delay = 0, glow = true }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      viewport={{ once: true }}
      className={`group relative ${className}`}
    >
      {glow && (
        <>
          <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl blur opacity-0 group-hover:opacity-20 transition duration-1000 group-hover:duration-200" />
          <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-2xl opacity-0 group-hover:opacity-10 blur-xl transition duration-1000" />
        </>
      )}
      <div className="relative">{children}</div>
    </motion.div>
  )
}