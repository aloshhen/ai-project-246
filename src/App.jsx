import React, { useState, useEffect, useRef, useMemo } from 'react'
import { motion, AnimatePresence, useInView } from 'framer-motion'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { clsx, ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Utility for tailwind class merging
function cn(...inputs) {
  return twMerge(clsx(inputs))
}

// ==========================================
// SAFE ICON COMPONENT
// ==========================================
const SafeIcon = ({ name, size = 24, className, color }) => {
  const [Icon, setIcon] = useState(null)
  
  useEffect(() => {
    import('lucide-react').then((icons) => {
      const iconName = name.split('-').map(part => 
        part.charAt(0).toUpperCase() + part.slice(1)
      ).join('')
      const FoundIcon = icons[iconName] || icons.HelpCircle
      setIcon(() => FoundIcon)
    })
  }, [name])
  
  if (!Icon) return <div style={{ width: size, height: size }} className={className} />
  
  return <Icon size={size} className={className} color={color} />
}

// ==========================================
// WEB3FORMS HOOK
// ==========================================
const useFormHandler = () => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [isError, setIsError] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  
  const handleSubmit = async (e, accessKey) => {
    e.preventDefault()
    setIsSubmitting(true)
    setIsError(false)
    
    const formData = new FormData(e.target)
    formData.append('access_key', accessKey)
    
    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        body: formData
      })
      
      const data = await response.json()
      
      if (data.success) {
        setIsSuccess(true)
        e.target.reset()
      } else {
        setIsError(true)
        setErrorMessage(data.message || 'Что-то пошло не так')
      }
    } catch (error) {
      setIsError(true)
      setErrorMessage('Ошибка сети. Попробуйте снова.')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const resetForm = () => {
    setIsSuccess(false)
    setIsError(false)
    setErrorMessage('')
  }
  
  return { isSubmitting, isSuccess, isError, errorMessage, handleSubmit, resetForm }
}

// ==========================================
// MAP COMPONENT
// ==========================================
const CleanMap = ({ coordinates = [37.6173, 55.7558], zoom = 12 }) => {
  const mapContainer = useRef(null)
  const map = useRef(null)

  useEffect(() => {
    if (map.current) return

    const styleUrl = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: styleUrl,
      center: coordinates,
      zoom: zoom,
      attributionControl: false,
      interactive: true,
      dragPan: true,
      dragRotate: false,
      touchZoomRotate: false,
      doubleClickZoom: true,
      keyboard: false
    })

    map.current.scrollZoom.disable()

    const el = document.createElement('div')
    el.style.cssText = `
      width: 24px;
      height: 24px;
      background: #f97316;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      cursor: pointer;
    `
    
    new maplibregl.Marker({ element: el })
      .setLngLat(coordinates)
      .setPopup(new maplibregl.Popup({ offset: 25 }).setHTML('<strong>Premium Auto</strong><br/>Москва, ул. Автомобильная, 1'))
      .addTo(map.current)

    return () => {
      if (map.current) {
        map.current.remove()
        map.current = null
      }
    }
  }, [coordinates, zoom])

  return (
    <div className="w-full h-full min-h-[300px] md:min-h-[400px] rounded-2xl overflow-hidden shadow-xl border border-gray-800 relative">
      <div ref={mapContainer} className="absolute inset-0" />
    </div>
  )
}

// ==========================================
// CHAT WIDGET COMPONENT
// ==========================================
const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    { type: 'bot', text: 'Здравствуйте! Я помогу вам подобрать автомобиль. Что вас интересует?' }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)

  const FAQ_DATA = [
    {
      question: 'кредит',
      answer: 'Мы предлагаем выгодные условия кредитования от 4.9% годовых. Одобрение за 5 минут без справок о доходах!',
      keywords: ['кредит', 'рассрочка', 'одобрение', 'банк', 'процент']
    },
    {
      question: 'trade-in',
      answer: 'Программа Trade-in позволяет обменять ваш старый автомобиль на новый с доплатой. Оценка за 15 минут, выгода до 100 000 ₽!',
      keywords: ['trade-in', 'обмен', 'зачет', 'старый авто', 'выкуп']
    },
    {
      question: 'гарантия',
      answer: 'На все автомобили предоставляется гарантия до 3 лет или 100 000 км. Также доступны расширенные гарантийные программы.',
      keywords: ['гарантия', 'страховка', 'поломка', 'ремонт', 'обслуживание']
    },
    {
      question: 'тест-драйв',
      answer: 'Записаться на тест-драйв можно прямо на сайте или по телефону. Доступен выездной тест-драйв в удобное для вас место.',
      keywords: ['тест-драйв', 'покататься', 'попробовать', 'за рулем']
    },
    {
      question: 'цена',
      answer: 'У нас честные цены без скрытых платежей. Возможны скидки при покупке за наличные и специальные предложения по кредиту.',
      keywords: ['цена', 'стоимость', 'сколько', 'дешево', 'дорого', 'скидка']
    }
  ]

  const handleSend = async () => {
    if (!inputValue.trim()) return
    
    const userMessage = inputValue.trim()
    setMessages(prev => [...prev, { type: 'user', text: userMessage }])
    setInputValue('')
    setIsTyping(true)

    // Check FAQ
    const lowerMessage = userMessage.toLowerCase()
    const faqMatch = FAQ_DATA.find(item => 
      item.keywords.some(keyword => lowerMessage.includes(keyword))
    )

    setTimeout(() => {
      if (faqMatch) {
        setMessages(prev => [...prev, { type: 'bot', text: faqMatch.answer }])
      } else {
        setMessages(prev => [...prev, { 
          type: 'bot', 
          text: 'Спасибо за вопрос! Наш менеджер свяжется с вами в ближайшее время. Позвоните нам по телефону +7 (999) 123-45-67 для быстрой консультации.' 
        }])
      }
      setIsTyping(false)
    }, 1000)
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-slate-900 border border-gray-800 rounded-2xl shadow-2xl w-[320px] md:w-[380px] mb-4 overflow-hidden"
          >
            <div className="bg-gradient-to-r from-orange-600 to-red-600 p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <SafeIcon name="bot" size={24} className="text-white" />
                </div>
                <div>
                  <h4 className="font-bold text-white">АвтоКонсультант</h4>
                  <p className="text-xs text-white/80">Онлайн</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-white/80 hover:text-white transition-colors"
              >
                <SafeIcon name="x" size={20} />
              </button>
            </div>
            
            <div className="h-[300px] overflow-y-auto p-4 space-y-3 bg-slate-950">
              {messages.map((msg, idx) => (
                <div 
                  key={idx} 
                  className={cn(
                    "p-3 rounded-xl max-w-[85%] text-sm",
                    msg.type === 'user' 
                      ? "bg-orange-600 text-white ml-auto" 
                      : "bg-gray-800 text-gray-200"
                  )}
                >
                  {msg.text}
                </div>
              ))}
              {isTyping && (
                <div className="flex gap-1 p-3 bg-gray-800 rounded-xl w-16">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                </div>
              )}
            </div>
            
            <div className="p-3 border-t border-gray-800 bg-slate-900">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Введите сообщение..."
                  className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 text-sm"
                />
                <button 
                  onClick={handleSend}
                  className="p-2 bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors"
                >
                  <SafeIcon name="send" size={18} className="text-white" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="bg-gradient-to-r from-orange-600 to-red-600 text-white p-4 rounded-full shadow-lg shadow-orange-600/30 flex items-center justify-center"
      >
        {isOpen ? <SafeIcon name="x" size={24} /> : <SafeIcon name="message-square" size={24} />}
      </motion.button>
    </div>
  )
}

// ==========================================
// MOCK DATA
// ==========================================
const CARS_DATA = [
  {
    id: 1,
    brand: 'BMW',
    model: 'X5',
    year: 2023,
    price: 8500000,
    oldPrice: 9200000,
    mileage: 15000,
    bodyType: 'suv',
    engine: 'benzin',
    transmission: 'auto',
    drive: '4wd',
    color: 'black',
    owners: 1,
    condition: 'used',
    image: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&q=80',
    power: 340,
    acceleration: 5.5,
    fuelConsumption: 9.2,
    maxSpeed: 250,
    features: ['Панорама', 'Кожаный салон', 'Адаптивный круиз', 'Камера 360']
  },
  {
    id: 2,
    brand: 'Mercedes',
    model: 'E-Class',
    year: 2024,
    price: 7200000,
    oldPrice,
    mileage: 0,
    bodyType: 'sedan',
    engine: 'benzin',
    transmission: 'auto',
    drive: 'rwd',
    color: 'white',
    owners: 0,
    condition: 'new',
    image: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800&q=80',
    power: 258,
    acceleration: 6.4,
    fuelConsumption: 7.8,
    maxSpeed: 250,
    features: ['MBUX', 'Пневмоподвеска', 'Burmester', 'Память сидений']
  },
  {
    id: 3,
    brand: 'Audi',
    model: 'Q7',
    year: 2023,
    price: 6800000,
    oldPrice: 7500000,
    mileage: 25000,
    bodyType: 'suv',
    engine: 'diesel',
    transmission: 'auto',
    drive: '4wd',
    color: 'gray',
    owners: 1,
    condition: 'used',
    image: 'https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?w=800&q=80',
    power: 286,
    acceleration: 6.3,
    fuelConsumption: 8.1,
    maxSpeed: 245,
    features: ['Matrix LED', 'Виртуальная приборка', 'Трехзонный климат', 'Панорама']
  },
  {
    id: 4,
    brand: 'Porsche',
    model: 'Cayenne',
    year: 2024,
    price: 12500000,
    oldPrice,
    mileage: 0,
    bodyType: 'suv',
    engine: 'hybrid',
    transmission: 'auto',
    drive: '4wd',
    color: 'blue',
    owners: 0,
    condition: 'new',
    image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80',
    power: 462,
    acceleration: 4.9,
    fuelConsumption: 3.2,
    maxSpeed: 253,
    features: ['Sport Chrono', 'Керамические тормоза', 'Адаптивные сиденья', 'BOSE']
  },
  {
    id: 5,
    brand: 'Tesla',
    model: 'Model S',
    year: 2024,
    price: 9800000,
    oldPrice: 10500000,
    mileage: 5000,
    bodyType: 'sedan',
    engine: 'electric',
    transmission: 'auto',
    drive: '4wd',
    color: 'red',
    owners: 1,
    condition: 'used',
    image: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800&q=80',
    power: 1020,
    acceleration: 2.1,
    fuelConsumption: 0,
    maxSpeed: 322,
    features: ['Autopilot', 'Игровой компьютер', 'Стеклянная крыша', '22 динамика']
  },
  {
    id: 6,
    brand: 'Lexus',
    model: 'RX 350',
    year: 2023,
    price: 5800000,
    oldPrice: 6200000,
    mileage: 18000,
    bodyType: 'suv',
    engine: 'hybrid',
    transmission: 'auto',
    drive: '4wd',
    color: 'silver',
    owners: 1,
    condition: 'used',
    image: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&q=80',
    power: 313,
    acceleration: 7.7,
    fuelConsumption: 6.5,
    maxSpeed: 200,
    features: ['Mark Levinson', 'Head-Up Display', 'Вентиляция', 'Массаж']
  }
]

const REVIEWS_DATA = [
  {
    id: 1,
    name: 'Александр М.',
    car: 'BMW X5 2023',
    text: 'Отличный сервис! Купил машину за один день, все документы оформили быстро. Особенно понравился тест-драйв без ограничений.',
    rating: 5,
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80'
  },
  {
    id: 2,
    name: 'Елена К.',
    car: 'Mercedes E-Class',
    text: 'Профессиональные менеджеры, не навязчивые. Помогли выбрать именно то, что нужно. Кредит одобрили за 10 минут!',
    rating: 5,
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80'
  },
  {
    id: 3,
    name: 'Дмитрий В.',
    car: 'Audi Q7',
    text: 'Обменял старый автомобиль по Trade-in. Оценка была честная, выше чем в других салонах. Рекомендую!',
    rating: 5,
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80'
  }
]

const FAQ_DATA = [
  {
    question: 'Какие документы нужны для покупки автомобиля?',
    answer: 'Для покупки необходим только паспорт гражданина РФ. При оформлении кредита потребуется второй документ (СНИЛС, ИНН или водительское удостоверение) и справка о доходах (не всегда обязательна).'
  },
  {
    question: 'Можно ли купить автомобиль в кредит без первоначального взноса?',
    answer: 'Да, мы сотрудничаем с банками, которые предоставляют кредит без первоначального взноса. Процентная ставка от 4.9% годовых, одобрение за 5 минут.'
  },
  {
    question: 'Как работает программа Trade-in?',
    answer: 'Вы пригоняете свой автомобиль, мы проводим бесплатную оценку (15-20 минут), называем честную цену. Эта сумма идет в зачет нового автомобиля. Доплату можно внести наличными или оформить в кредит.'
  },
  {
    question: 'Предоставляется ли гарантия на подержанные автомобили?',
    answer: 'Да, на все автомобили с пробегом мы предоставляем расширенную гарантию до 2 лет или 100 000 км. Гарантия распространяется на двигатель, КПП и электронику.'
  },
  {
    question: 'Можно ли записаться на тест-драйв?',
    answer: 'Конечно! Записаться можно через сайт, по телефону или в мессенджерах. Доступен выездной тест-драйв — мы привезем автомобиль к вам.'
  }
]

// ==========================================
// MAIN APP COMPONENT
// ==========================================
function App() {
  const [activeSection, setActiveSection] = useState('home')
  const [selectedCar, setSelectedCar] = useState(null)
  const [favorites, setFavorites] = useState([])
  const [compareList, setCompareList] = useState([])
  const [showCompare, setShowCompare] = useState(false)
  const [filters, setFilters] = useState({
    brand: '',
    bodyType: '',
    engine: '',
    priceFrom: '',
    priceTo: '',
    condition: ''
  })
  const [creditCalc, setCreditCalc] = useState({
    price: 1000000,
    initial: 200000,
    months: 60,
    rate: 4.9
  })
  const [showCallbackModal, setShowCallbackModal] = useState(false)
  const [showTestDriveModal, setShowTestDriveModal] = useState(false)
  const [showCreditModal, setShowCreditModal] = useState(false)

  // Form hooks
  const callbackForm = useFormHandler()
  const testDriveForm = useFormHandler()
  const creditForm = useFormHandler()
  const tradeInForm = useFormHandler()

  // Scroll to section
  const scrollToSection = (id) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
      setActiveSection(id)
    }
  }

  // Filter cars
  const filteredCars = useMemo(() => {
    return CARS_DATA.filter(car => {
      if (filters.brand && car.brand !== filters.brand) return false
      if (filters.bodyType && car.bodyType !== filters.bodyType) return false
      if (filters.engine && car.engine !== filters.engine) return false
      if (filters.condition && car.condition !== filters.condition) return false
      if (filters.priceFrom && car.price < parseInt(filters.priceFrom)) return false
      if (filters.priceTo && car.price > parseInt(filters.priceTo)) return false
      return true
    })
  }, [filters])

  // Toggle favorite
  const toggleFavorite = (carId) => {
    setFavorites(prev => 
      prev.includes(carId) 
        ? prev.filter(id => id !== carId)
        : [...prev, carId]
    )
  }

  // Toggle compare
  const toggleCompare = (car) => {
    setCompareList(prev => {
      const exists = prev.find(c => c.id === car.id)
      if (exists) {
        return prev.filter(c => c.id !== car.id)
      }
      if (prev.length >= 4) {
        alert('Можно сравнивать максимум 4 автомобиля')
        return prev
      }
      return [...prev, car]
    })
  }

  // Calculate credit
  const calculateCredit = () => {
    const amount = creditCalc.price - creditCalc.initial
    const monthlyRate = creditCalc.rate / 100 / 12
    const months = creditCalc.months
    const payment = amount * (monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1)
    return Math.round(payment)
  }

  // Count animation
  const CountUp = ({ end, duration = 2, suffix = '' }) => {
    const [count, setCount] = useState(0)
    const ref = useRef(null)
    const isInView = useInView(ref, { once: true })

    useEffect(() => {
      if (!isInView) return
      let startTime = null
      const animate = (timestamp) => {
        if (!startTime) startTime = timestamp
        const progress = Math.min((timestamp - startTime) / (duration * 1000), 1)
        setCount(Math.floor(progress * end))
        if (progress < 1) {
          requestAnimationFrame(animate)
        }
      }
      requestAnimationFrame(animate)
    }, [isInView, end, duration])

    return <span ref={ref}>{count.toLocaleString()}{suffix}</span>
  }

  // Car Card Component
  const CarCard = ({ car }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="bg-gray-900 rounded-2xl overflow-hidden border border-gray-800 hover:border-orange-500/50 transition-all group"
    >
      <div className="relative h-48 overflow-hidden">
        <img 
          src={car.image} 
          alt={`${car.brand} ${car.model}`}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
        />
        {car.oldPrice && (
          <div className="absolute top-3 left-3 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold">
            Скидка {Math.round((1 - car.price / car.oldPrice) * 100)}%
          </div>
        )}
        <button
          onClick={() => toggleFavorite(car.id)}
          className="absolute top-3 right-3 w-10 h-10 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center transition-colors hover:bg-black/70"
        >
          <SafeIcon 
            name={favorites.includes(car.id) ? 'heart' : 'heart'} 
            size={20} 
            className={favorites.includes(car.id) ? 'text-red-500 fill-red-500' : 'text-white'}
          />
        </button>
        <div className="absolute bottom-3 left-3 flex gap-2">
          <span className="bg-black/70 backdrop-blur-sm text-white px-2 py-1 rounded text-xs">
            {car.year}
          </span>
          <span className="bg-black/70 backdrop-blur-sm text-white px-2 py-1 rounded text-xs">
            {car.mileage === 0 ? 'Новый' : `${car.mileage.toLocaleString()} км`}
          </span>
        </div>
      </div>
      
      <div className="p-5">
        <h3 className="text-xl font-bold text-white mb-2">{car.brand} {car.model}</h3>
        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-2xl font-bold text-orange-500">{car.price.toLocaleString()} ₽</span>
          {car.oldPrice && (
            <span className="text-gray-500 line-through text-sm">{car.oldPrice.toLocaleString()} ₽</span>
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-2 text-sm text-gray-400 mb-4">
          <div className="flex items-center gap-1">
            <SafeIcon name="fuel" size={14} />
            <span className="capitalize">{car.engine}</span>
          </div>
          <div className="flex items-center gap-1">
            <SafeIcon name="settings-2" size={14} />
            <span className="capitalize">{car.transmission}</span>
          </div>
          <div className="flex items-center gap-1">
            <SafeIcon name="gauge" size={14} />
            <span>{car.power} л.с.</span>
          </div>
          <div className="flex items-center gap-1">
            <SafeIcon name="car" size={14} />
            <span className="capitalize">{car.drive}</span>
          </div>
        </div>

        <div className="flex gap-2">
          <button 
            onClick={() => setSelectedCar(car)}
            className="flex-1 bg-orange-600 hover:bg-orange-700 text-white py-2 rounded-lg font-semibold transition-colors text-sm"
          >
            Подробнее
          </button>
          <button
            onClick={() => toggleCompare(car)}
            className={cn(
              "px-3 py-2 rounded-lg border transition-colors",
              compareList.find(c => c.id === car.id)
                ? "bg-orange-600 border-orange-600 text-white"
                : "border-gray-700 text-gray-400 hover:border-orange-500"
            )}
          >
            <SafeIcon name="git-compare" size={18} />
          </button>
        </div>
      </div>
    </motion.div>
  )

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-x-hidden">
      {/* Fixed Contact Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-md border-b border-gray-800">
        <div className="container mx-auto px-4 py-2 flex justify-between items-center text-sm">
          <div className="hidden md:flex items-center gap-6 text-gray-400">
            <span className="flex items-center gap-1">
              <SafeIcon name="map-pin" size={14} className="text-orange-500" />
              Москва, ул. Автомобильная, 1
            </span>
            <span className="flex items-center gap-1">
              <SafeIcon name="clock" size={14} className="text-orange-500" />
              Ежедневно 9:00-21:00
            </span>
          </div>
          <div className="flex items-center gap-4 ml-auto">
            <a href="tel:+79991234567" className="flex items-center gap-1 text-orange-500 font-bold hover:text-orange-400">
              <SafeIcon name="phone" size={14} />
              +7 (999) 123-45-67
            </a>
            <div className="hidden sm:flex gap-2">
              <a href="https://t.me/premiumauto" className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center hover:bg-orange-600 transition-colors">
                <SafeIcon name="send" size={14} />
              </a>
              <a href="https://wa.me/79991234567" className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center hover:bg-green-600 transition-colors">
                <SafeIcon name="message-circle" size={14} />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <header className="fixed top-10 left-0 right-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-gray-800">
        <nav className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => scrollToSection('home')}>
            <div className="w-10 h-10 bg-gradient-to-br from-orange-600 to-red-600 rounded-lg flex items-center justify-center">
              <SafeIcon name="car" size={24} className="text-white" />
            </div>
            <span className="text-2xl font-black tracking-tight">
              PREMIUM<span className="text-orange-500">AUTO</span>
            </span>
          </div>
          
          <div className="hidden lg:flex items-center gap-8">
            {[
              { id: 'catalog', label: 'Каталог' },
              { id: 'credit', label: 'Кредит' },
              { id: 'trade-in', label: 'Trade-in' },
              { id: 'about', label: 'О нас' },
              { id: 'reviews', label: 'Отзывы' },
              { id: 'contacts', label: 'Контакты' }
            ].map(item => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className="text-gray-300 hover:text-orange-500 transition-colors font-medium"
              >
                {item.label}
              </button>
            ))}
          </div>

          <button 
            onClick={() => setShowCallbackModal(true)}
            className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-lg font-bold transition-all transform hover:scale-105 hidden sm:block"
          >
            Обратный звонок
          </button>
          
          <button className="lg:hidden text-white">
            <SafeIcon name="menu" size={24} />
          </button>
        </nav>
      </header>

      {/* Hero Section */}
      <section id="home" className="relative pt-32 pb-20 md:pt-40 md:pb-32 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 to-transparent z-10" />
          <img 
            src="https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1920&q=80" 
            alt="Luxury car"
            className="w-full h-full object-cover opacity-60"
          />
        </div>
        
        <div className="container mx-auto px-4 relative z-20">
          <div className="max-w-2xl">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 bg-orange-600/20 border border-orange-500/30 rounded-full px-4 py-2 mb-6">
                <SafeIcon name="sparkles" size={16} className="text-orange-500" />
                <span className="text-orange-400 font-medium">Специальное предложение месяца</span>
              </div>
              
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-black leading-tight mb-6">
                Найдите свой <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-600">
                  идеальный авто
                </span>
              </h1>
              
              <p className="text-lg md:text-xl text-gray-400 mb-8 leading-relaxed">
                Премиальные автомобили с пробегом и новые от официальных дилеров. 
                Гарантия качества, выгодный кредит от 4.9% и программа Trade-in.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={() => scrollToSection('catalog')}
                  className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all transform hover:scale-105 flex items-center justify-center gap-2"
                >
                  Смотреть каталог
                  <SafeIcon name="arrow-right" size={20} />
                </button>
                <button 
                  onClick={() => setShowTestDriveModal(true)}
                  className="bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all"
                >
                  Записаться на тест-драйв
                </button>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Stats */}
        <div className="container mx-auto px-4 mt-16 relative z-20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
            {[
              { value: 1500, suffix: '+', label: 'Авто в наличии' },
              { value: 15, suffix: '', label: 'Лет на рынке' },
              { value: 50000, suffix: '+', label: 'Довольных клиентов' },
              { value: 98, suffix: '%', label: 'Одобрение кредита' }
            ].map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + idx * 0.1 }}
                className="bg-black/40 backdrop-blur-md border border-gray-800 rounded-2xl p-6 text-center"
              >
                <div className="text-3xl md:text-4xl font-black text-orange-500 mb-2">
                  <CountUp end={stat.value} suffix={stat.suffix} />
                </div>
                <div className="text-gray-400 text-sm">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Search */}
      <section className="py-10 bg-gray-900/50 border-y border-gray-800">
        <div className="container mx-auto px-4">
          <div className="bg-slate-900 rounded-2xl p-6 md:p-8 border border-gray-800">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <SafeIcon name="search" size={24} className="text-orange-500" />
              Быстрый подбор авто
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <select 
                className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500"
                value={filters.brand}
                onChange={(e) => setFilters({...filters, brand: e.target.value})}
              >
                <option value="">Марка</option>
                <option value="BMW">BMW</option>
                <option value="Mercedes">Mercedes</option>
                <option value="Audi">Audi</option>
                <option value="Porsche">Porsche</option>
                <option value="Tesla">Tesla</option>
                <option value="Lexus">Lexus</option>
              </select>
              
              <select 
                className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500"
                value={filters.bodyType}
                onChange={(e) => setFilters({...filters, bodyType: e.target.value})}
              >
                <option value="">Кузов</option>
                <option value="sedan">Седан</option>
                <option value="suv">Внедорожник</option>
                <option value="hatchback">Хэтчбек</option>
              </select>
              
              <select 
                className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500"
                value={filters.engine}
                onChange={(e) => setFilters({...filters, engine: e.target.value})}
              >
                <option value="">Двигатель</option>
                <option value="benzin">Бензин</option>
                <option value="diesel">Дизель</option>
                <option value="hybrid">Гибрид</option>
                <option value="electric">Электро</option>
              </select>
              
              <select 
                className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500"
                value={filters.condition}
                onChange={(e) => setFilters({...filters, condition: e.target.value})}
              >
                <option value="">Состояние</option>
                <option value="new">Новый</option>
                <option value="used">С пробегом</option>
              </select>
              
              <input 
                type="number"
                placeholder="Цена от"
                className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500 placeholder-gray-500"
                value={filters.priceFrom}
                onChange={(e) => setFilters({...filters, priceFrom: e.target.value})}
              />
              
              <button 
                onClick={() => scrollToSection('catalog')}
                className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-bold transition-colors col-span-2 md:col-span-1"
              >
                Найти
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Catalog Section */}
      <section id="catalog" className="py-20 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
            <div>
              <h2 className="text-3xl md:text-5xl font-black mb-2">
                Автомобили в <span className="text-orange-500">наличии</span>
              </h2>
              <p className="text-gray-400">Найдено {filteredCars.length} автомобилей</p>
            </div>
            
            {compareList.length > 0 && (
              <button 
                onClick={() => setShowCompare(true)}
                className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <SafeIcon name="git-compare" size={18} />
                Сравнение ({compareList.length})
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCars.map(car => (
              <CarCard key={car.id} car={car} />
            ))}
          </div>

          {filteredCars.length === 0 && (
            <div className="text-center py-20">
              <SafeIcon name="search-x" size={64} className="text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">По вашему запросу ничего не найдено</p>
              <button 
                onClick={() => setFilters({ brand: '', bodyType: '', engine: '', priceFrom: '', priceTo: '', condition: '' })}
                className="mt-4 text-orange-500 hover:text-orange-400"
              >
                Сбросить фильтры
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 px-4 bg-gradient-to-b from-gray-900 to-slate-950">
        <div className="container mx-auto max-w-7xl">
          <h2 className="text-3xl md:text-5xl font-black text-center mb-16">
            Почему выбирают <span className="text-orange-500">нас</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: 'shield-check', title: 'Гарантия качества', desc: 'Проверка каждого авто по 120 параметрам' },
              { icon: 'badge-check', title: 'Юридическая чистота', desc: 'Полная проверка документов и истории' },
              { icon: 'wrench', title: 'Сервисное обслуживание', desc: 'Собственный центр с лучшими мастерами' },
              { icon: 'refresh-cw', title: 'Trade-in', desc: 'Выгодный обмен с доплатой до 100 000 ₽' }
            ].map((benefit, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="bg-slate-900 border border-gray-800 rounded-2xl p-6 text-center hover:border-orange-500/50 transition-all group"
              >
                <div className="w-16 h-16 bg-orange-600/20 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-orange-600/30 transition-colors">
                  <SafeIcon name={benefit.icon} size={32} className="text-orange-500" />
                </div>
                <h3 className="text-xl font-bold mb-2">{benefit.title}</h3>
                <p className="text-gray-400">{benefit.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Credit Calculator */}
      <section id="credit" className="py-20 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="bg-gradient-to-br from-gray-900 to-slate-900 rounded-3xl p-6 md:p-12 border border-gray-800">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl md:text-5xl font-black mb-6">
                  Кредит от <span className="text-orange-500">4.9%</span>
                </h2>
                <p className="text-gray-400 text-lg mb-8">
                  Одобрение за 5 минут без справок о доходах. Первоначальный взнос от 0%.
                  Рассрочка до 7 лет.
                </p>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-600/20 rounded-full flex items-center justify-center">
                      <SafeIcon name="check" size={20} className="text-green-500" />
                    </div>
                    <span>Одобрение в день обращения</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-600/20 rounded-full flex items-center justify-center">
                      <SafeIcon name="check" size={20} className="text-green-500" />
                    </div>
                    <span>Без КАСКО и страхования жизни</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-600/20 rounded-full flex items-center justify-center">
                      <SafeIcon name="check" size={20} className="text-green-500" />
                    </div>
                    <span>Досрочное погашение без комиссий</span>
                  </div>
                </div>
                
                <button 
                  onClick={() => setShowCreditModal(true)}
                  className="mt-8 bg-orange-600 hover:bg-orange-700 text-white px-8 py-4 rounded-xl font-bold transition-all transform hover:scale-105"
                >
                  Получить одобрение
                </button>
              </div>
              
              <div className="bg-black/30 rounded-2xl p-6 md:p-8">
                <h3 className="text-xl font-bold mb-6">Кредитный калькулятор</h3>
                
                <div className="space-y-6">
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">Стоимость авто</label>
                    <input 
                      type="range"
                      min="500000"
                      max="15000000"
                      step="100000"
                      value={creditCalc.price}
                      onChange={(e) => setCreditCalc({...creditCalc, price: parseInt(e.target.value)})}
                      className="w-full accent-orange-500"
                    />
                    <div className="text-2xl font-bold text-orange-500 mt-2">
                      {creditCalc.price.toLocaleString()} ₽
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">Первоначальный взнос</label>
                    <input 
                      type="range"
                      min="0"
                      max={creditCalc.price * 0.5}
                      step="50000"
                      value={creditCalc.initial}
                      onChange={(e) => setCreditCalc({...creditCalc, initial: parseInt(e.target.value)})}
                      className="w-full accent-orange-500"
                    />
                    <div className="text-xl font-bold mt-2">
                      {creditCalc.initial.toLocaleString()} ₽
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">Срок кредита</label>
                    <div className="flex gap-2 flex-wrap">
                      {[12, 24, 36, 48, 60, 84].map(months => (
                        <button
                          key={months}
                          onClick={() => setCreditCalc({...creditCalc, months})}
                          className={cn(
                            "px-4 py-2 rounded-lg transition-colors",
                            creditCalc.months === months
                              ? "bg-orange-600 text-white"
                              : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                          )}
                        >
                          {months} мес
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="bg-orange-600/20 border border-orange-500/30 rounded-xl p-6 text-center">
                    <div className="text-sm text-gray-400 mb-2">Ежемесячный платеж</div>
                    <div className="text-4xl font-black text-orange-500">
                      {calculateCredit().toLocaleString()} ₽
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trade-in Section */}
      <section id="trade-in" className="py-20 px-4 bg-gray-900/30">
        <div className="container mx-auto max-w-7xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1">
              <img 
                src="https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=800&q=80" 
                alt="Trade-in"
                className="rounded-3xl shadow-2xl"
              />
            </div>
            <div className="order-1 md:order-2">
              <h2 className="text-3xl md:text-5xl font-black mb-6">
                Обменяйте авто с <span className="text-orange-500">выгодой</span>
              </h2>
              <p className="text-gray-400 text-lg mb-8">
                Программа Trade-in позволяет быстро и выгодно обменять ваш старый автомобиль на новый. 
                Оценка за 15 минут, доплата от 0 ₽.
              </p>
              
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-slate-900 border border-gray-800 rounded-xl p-4">
                  <div className="text-3xl font-black text-orange-500 mb-1">15 мин</div>
                  <div className="text-sm text-gray-400">На оценку</div>
                </div>
                <div className="bg-slate-900 border border-gray-800 rounded-xl p-4">
                  <div className="text-3xl font-black text-orange-500 mb-1">+100к</div>
                  <div className="text-sm text-gray-400">Бонус к цене</div>
                </div>
              </div>
              
              <button 
                onClick={() => setShowCallbackModal(true)}
                className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-4 rounded-xl font-bold transition-all transform hover:scale-105"
              >
                Оценить мое авто
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-5xl font-black mb-6">
              О компании <span className="text-orange-500">Premium Auto</span>
            </h2>
            <p className="text-gray-400 text-lg">
              15 лет мы помогаем людям найти автомобиль мечты. 
              Нам доверились более 50 000 клиентов.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-slate-900 border border-gray-800 rounded-2xl p-8 text-center">
              <div className="w-20 h-20 bg-orange-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <SafeIcon name="award" size={40} className="text-orange-500" />
              </div>
              <h3 className="text-xl font-bold mb-3">Официальный дилер</h3>
              <p className="text-gray-400">Прямые контракты с ведущими мировыми производителями</p>
            </div>
            <div className="bg-slate-900 border border-gray-800 rounded-2xl p-8 text-center">
              <div className="w-20 h-20 bg-orange-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <SafeIcon name="users" size={40} className="text-orange-500" />
              </div>
              <h3 className="text-xl font-bold mb-3">Профессиональная команда</h3>
              <p className="text-gray-400">Более 200 специалистов с опытом работы от 5 лет</p>
            </div>
            <div className="bg-slate-900 border border-gray-800 rounded-2xl p-8 text-center">
              <div className="w-20 h-20 bg-orange-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <SafeIcon name="trophy" size={40} className="text-orange-500" />
              </div>
              <h3 className="text-xl font-bold mb-3">Лидер отрасли</h3>
              <p className="text-gray-400">Топ-3 автосалонов Москвы по версии Auto.ru</p>
            </div>
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section id="reviews" className="py-20 px-4 bg-gray-900/30">
        <div className="container mx-auto max-w-7xl">
          <h2 className="text-3xl md:text-5xl font-black text-center mb-16">
            Отзывы наших <span className="text-orange-500">клиентов</span>
          </h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            {REVIEWS_DATA.map((review) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-slate-900 border border-gray-800 rounded-2xl p-6"
              >
                <div className="flex items-center gap-4 mb-4">
                  <img 
                    src={review.image} 
                    alt={review.name}
                    className="w-14 h-14 rounded-full object-cover"
                  />
                  <div>
                    <h4 className="font-bold">{review.name}</h4>
                    <p className="text-sm text-orange-500">{review.car}</p>
                  </div>
                </div>
                <div className="flex gap-1 mb-3">
                  {[...Array(review.rating)].map((_, i) => (
                    <SafeIcon key={i} name="star" size={16} className="text-yellow-500 fill-yellow-500" />
                  ))}
                </div>
                <p className="text-gray-400">{review.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-3xl">
          <h2 className="text-3xl md:text-5xl font-black text-center mb-16">
            Часто задаваемые <span className="text-orange-500">вопросы</span>
          </h2>
          
          <div className="space-y-4">
            {FAQ_DATA.map((faq, idx) => (
              <FAQItem key={idx} question={faq.question} answer={faq.answer} />
            ))}
          </div>
        </div>
      </section>

      {/* Contacts */}
      <section id="contacts" className="py-20 px-4 bg-gray-900/30">
        <div className="container mx-auto max-w-7xl">
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h2 className="text-3xl md:text-5xl font-black mb-8">
                Свяжитесь с <span className="text-orange-500">нами</span>
              </h2>
              
              <div className="space-y-6 mb-8">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-orange-600/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <SafeIcon name="map-pin" size={24} className="text-orange-500" />
                  </div>
                  <div>
                    <h4 className="font-bold mb-1">Адрес</h4>
                    <p className="text-gray-400">Москва, ул. Автомобильная, 1<br />м. Автозаводская</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-orange-600/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <SafeIcon name="phone" size={24} className="text-orange-500" />
                  </div>
                  <div>
                    <h4 className="font-bold mb-1">Телефон</h4>
                    <a href="tel:+79991234567" className="text-gray-400 hover:text-orange-500 transition-colors">+7 (999) 123-45-67</a>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-orange-600/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <SafeIcon name="clock" size={24} className="text-orange-500" />
                  </div>
                  <div>
                    <h4 className="font-bold mb-1">Режим работы</h4>
                    <p className="text-gray-400">Ежедневно: 9:00 - 21:00<br />Без выходных</p>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-4">
                <a href="https://t.me/premiumauto" className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center hover:bg-blue-700 transition-colors">
                  <SafeIcon name="send" size={24} />
                </a>
                <a href="https://wa.me/79991234567" className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center hover:bg-green-700 transition-colors">
                  <SafeIcon name="message-circle" size={24} />
                </a>
                <a href="mailto:info@premiumauto.ru" className="w-12 h-12 bg-gray-700 rounded-xl flex items-center justify-center hover:bg-gray-600 transition-colors">
                  <SafeIcon name="mail" size={24} />
                </a>
              </div>
            </div>
            
            <div className="h-[400px] rounded-2xl overflow-hidden">
              <CleanMap coordinates={[37.6173, 55.7558]} zoom={13} />
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black border-t border-gray-800 py-12 px-4 telegram-safe-bottom">
        <div className="container mx-auto max-w-7xl">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-600 to-red-600 rounded-lg flex items-center justify-center">
                  <SafeIcon name="car" size={24} className="text-white" />
                </div>
                <span className="text-2xl font-black">
                  PREMIUM<span className="text-orange-500">AUTO</span>
                </span>
              </div>
              <p className="text-gray-400 text-sm">
                Продажа новых и подержанных автомобилей премиум класса с 2009 года.
              </p>
            </div>
            
            <div>
              <h4 className="font-bold mb-4">Разделы</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><button onClick={() => scrollToSection('catalog')} className="hover:text-orange-500 transition-colors">Каталог</button></li>
                <li><button onClick={() => scrollToSection('credit')} className="hover:text-orange-500 transition-colors">Кредит</button></li>
                <li><button onClick={() => scrollToSection('trade-in')} className="hover:text-orange-500 transition-colors">Trade-in</button></li>
                <li><button onClick={() => scrollToSection('about')} className="hover:text-orange-500 transition-colors">О компании</button></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold mb-4">Услуги</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li>Тест-драйв</li>
                <li>Онлайн-оценка</li>
                <li>Кредитование</li>
                <li>Страхование</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold mb-4">Контакты</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li>+7 (999) 123-45-67</li>
                <li>info@premiumauto.ru</li>
                <li>Москва, ул. Автомобильная, 1</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500">
            <p>© 2024 Premium Auto. Все права защищены.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-white transition-colors">Политика конфиденциальности</a>
              <a href="#" className="hover:text-white transition-colors">Пользовательское соглашение</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Car Detail Modal */}
      <AnimatePresence>
        {selectedCar && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm overflow-y-auto"
            onClick={() => setSelectedCar(null)}
          >
            <div className="min-h-screen px-4 py-20">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-slate-900 rounded-3xl max-w-5xl mx-auto overflow-hidden border border-gray-800"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="relative h-64 md:h-96">
                  <img 
                    src={selectedCar.image} 
                    alt={`${selectedCar.brand} ${selectedCar.model}`}
                    className="w-full h-full object-cover"
                  />
                  <button 
                    onClick={() => setSelectedCar(null)}
                    className="absolute top-4 right-4 w-10 h-10 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-black/70 transition-colors"
                  >
                    <SafeIcon name="x" size={24} />
                  </button>
                  {selectedCar.oldPrice && (
                    <div className="absolute top-4 left-4 bg-red-600 text-white px-4 py-2 rounded-full font-bold">
                      Экономия {((selectedCar.oldPrice - selectedCar.price) / 1000).toFixed(0)} тыс. ₽
                    </div>
                  )}
                </div>
                
                <div className="p-6 md:p-8">
                  <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
                    <div>
                      <h2 className="text-3xl md:text-4xl font-black mb-2">
                        {selectedCar.brand} {selectedCar.model}
                      </h2>
                      <p className="text-gray-400">{selectedCar.year} год • {selectedCar.mileage === 0 ? 'Новый' : `${selectedCar.mileage.toLocaleString()} км`}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl md:text-4xl font-black text-orange-500">
                        {selectedCar.price.toLocaleString()} ₽
                      </div>
                      {selectedCar.oldPrice && (
                        <div className="text-gray-500 line-through">{selectedCar.oldPrice.toLocaleString()} ₽</div>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-gray-800/50 rounded-xl p-4">
                      <SafeIcon name="gauge" size={20} className="text-orange-500 mb-2" />
                      <div className="text-sm text-gray-400">Мощность</div>
                      <div className="font-bold">{selectedCar.power} л.с.</div>
                    </div>
                    <div className="bg-gray-800/50 rounded-xl p-4">
                      <SafeIcon name="zap" size={20} className="text-orange-500 mb-2" />
                      <div className="text-sm text-gray-400">Разгон</div>
                      <div className="font-bold">{selectedCar.acceleration} сек</div>
                    </div>
                    <div className="bg-gray-800/50 rounded-xl p-4">
                      <SafeIcon name="fuel" size={20} className="text-orange-500 mb-2" />
                      <div className="text-sm text-gray-400">Расход</div>
                      <div className="font-bold">{selectedCar.fuelConsumption} л/100км</div>
                    </div>
                    <div className="bg-gray-800/50 rounded-xl p-4">
                      <SafeIcon name="trending-up" size={20} className="text-orange-500 mb-2" />
                      <div className="text-sm text-gray-400">Макс. скорость</div>
                      <div className="font-bold">{selectedCar.maxSpeed} км/ч</div>
                    </div>
                  </div>
                  
                  <div className="mb-8">
                    <h3 className="text-xl font-bold mb-4">Комплектация</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedCar.features.map((feature, idx) => (
                        <span key={idx} className="bg-orange-600/20 text-orange-400 px-3 py-1 rounded-full text-sm">
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-4">
                    <button 
                      onClick={() => setShowCreditModal(true)}
                      className="flex-1 bg-orange-600 hover:bg-orange-700 text-white py-4 rounded-xl font-bold transition-colors"
                    >
                      Купить в кредит
                    </button>
                    <button 
                      onClick={() => setShowTestDriveModal(true)}
                      className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-4 rounded-xl font-bold transition-colors"
                    >
                      Тест-драйв
                    </button>
                    <button 
                      onClick={() => {setSelectedCar(null); setShowCallbackModal(true);}}
                      className="flex-1 border border-gray-700 hover:border-orange-500 text-white py-4 rounded-xl font-bold transition-colors"
                    >
                      Обменять авто
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Compare Modal */}
      <AnimatePresence>
        {showCompare && compareList.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm overflow-y-auto"
          >
            <div className="min-h-screen px-4 py-20">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-slate-900 rounded-3xl max-w-6xl mx-auto overflow-hidden border border-gray-800"
              >
                <div className="p-6 border-b border-gray-800 flex justify-between items-center">
                  <h2 className="text-2xl font-black">Сравнение автомобилей</h2>
                  <button 
                    onClick={() => setShowCompare(false)}
                    className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-700 transition-colors"
                  >
                    <SafeIcon name="x" size={24} />
                  </button>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-800">
                        <th className="p-4 text-left text-gray-400 font-medium">Параметр</th>
                        {compareList.map(car => (
                          <th key={car.id} className="p-4 text-left">
                            <div className="w-32">
                              <img src={car.image} alt={car.model} className="w-full h-20 object-cover rounded-lg mb-2" />
                              <div className="font-bold">{car.brand} {car.model}</div>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { label: 'Цена', key: 'price', format: (v) => `${v.toLocaleString()} ₽` },
                        { label: 'Год', key: 'year' },
                        { label: 'Мощность', key: 'power', format: (v) => `${v} л.с.` },
                        { label: 'Пробег', key: 'mileage', format: (v) => v === 0 ? 'Новый' : `${v.toLocaleString()} км` },
                        { label: 'Разгон', key: 'acceleration', format: (v) => `${v} сек` },
                        { label: 'Расход', key: 'fuelConsumption', format: (v) => `${v} л/100км` }
                      ].map((param, idx) => (
                        <tr key={idx} className="border-b border-gray-800">
                          <td className="p-4 text-gray-400">{param.label}</td>
                          {compareList.map(car => (
                            <td key={car.id} className="p-4 font-medium">
                              {param.format ? param.format(car[param.key]) : car[param.key]}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                <div className="p-6 flex gap-4">
                  <button 
                    onClick={() => setCompareList([])}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Очистить сравнение
                  </button>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Callback Modal */}
      <AnimatePresence>
        {showCallbackModal && (
          <Modal onClose={() => setShowCallbackModal(false)} title="Обратный звонок">
            {!callbackForm.isSuccess ? (
              <form onSubmit={(e) => callbackForm.handleSubmit(e, 'YOUR_WEB3FORMS_ACCESS_KEY')} className="space-y-4">
                <input type="hidden" name="subject" value="Заявка на обратный звонок" />
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Ваше имя</label>
                  <input 
                    type="text" 
                    name="name"
                    required
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500"
                    placeholder="Иван Иванов"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Телефон</label>
                  <input 
                    type="tel" 
                    name="phone"
                    required
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500"
                    placeholder="+7 (999) 123-45-67"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Удобное время</label>
                  <select name="time" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500">
                    <option>Сейчас</option>
                    <option>10:00 - 12:00</option>
                    <option>12:00 - 14:00</option>
                    <option>14:00 - 16:00</option>
                    <option>16:00 - 18:00</option>
                    <option>18:00 - 20:00</option>
                  </select>
                </div>
                {callbackForm.isError && (
                  <div className="text-red-500 text-sm">{callbackForm.errorMessage}</div>
                )}
                <button 
                  type="submit"
                  disabled={callbackForm.isSubmitting}
                  className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 text-white py-4 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
                >
                  {callbackForm.isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Отправка...
                    </>
                  ) : (
                    <>Позвоните мне</>
                  )}
                </button>
              </form>
            ) : (
              <SuccessMessage onReset={callbackForm.resetForm} />
            )}
          </Modal>
        )}
      </AnimatePresence>

      {/* Test Drive Modal */}
      <AnimatePresence>
        {showTestDriveModal && (
          <Modal onClose={() => setShowTestDriveModal(false)} title="Запись на тест-драйв">
            {!testDriveForm.isSuccess ? (
              <form onSubmit={(e) => testDriveForm.handleSubmit(e, 'YOUR_WEB3FORMS_ACCESS_KEY')} className="space-y-4">
                <input type="hidden" name="subject" value="Запись на тест-драйв" />
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Ваше имя</label>
                  <input 
                    type="text" 
                    name="name"
                    required
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Телефон</label>
                  <input 
                    type="tel" 
                    name="phone"
                    required
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Дата</label>
                    <input 
                      type="date" 
                      name="date"
                      required
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Время</label>
                    <select name="time" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500">
                      <option>10:00</option>
                      <option>11:00</option>
                      <option>12:00</option>
                      <option>13:00</option>
                      <option>14:00</option>
                      <option>15:00</option>
                      <option>16:00</option>
                      <option>17:00</option>
                      <option>18:00</option>
                      <option>19:00</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Интересующий автомобиль</label>
                  <input 
                    type="text" 
                    name="car"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500"
                    placeholder="BMW X5"
                  />
                </div>
                <button 
                  type="submit"
                  disabled={testDriveForm.isSubmitting}
                  className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 text-white py-4 rounded-xl font-bold transition-colors"
                >
                  {testDriveForm.isSubmitting ? 'Отправка...' : 'Записаться'}
                </button>
              </form>
            ) : (
              <SuccessMessage onReset={testDriveForm.resetForm} />
            )}
          </Modal>
        )}
      </AnimatePresence>

      {/* Credit Modal */}
      <AnimatePresence>
        {showCreditModal && (
          <Modal onClose={() => setShowCreditModal(false)} title="Заявка на кредит">
            {!creditForm.isSuccess ? (
              <form onSubmit={(e) => creditForm.handleSubmit(e, 'YOUR_WEB3FORMS_ACCESS_KEY')} className="space-y-4">
                <input type="hidden" name="subject" value="Заявка на кредит" />
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Ваше имя</label>
                  <input 
                    type="text" 
                    name="name"
                    required
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Телефон</label>
                  <input 
                    type="tel" 
                    name="phone"
                    required
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Сумма кредита</label>
                  <select name="amount" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500">
                    <option>500 000 - 1 000 000 ₽</option>
                    <option>1 000 000 - 3 000 000 ₽</option>
                    <option>3 000 000 - 5 000 000 ₽</option>
                    <option>5 000 000 - 10 000 000 ₽</option>
                    <option>Более 10 000 000 ₽</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Первоначальный взнос</label>
                  <select name="initial" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500">
                    <option>0% (без взноса)</option>
                    <option>10%</option>
                    <option>20%</option>
                    <option>30%</option>
                    <option>50% и более</option>
                  </select>
                </div>
                <button 
                  type="submit"
                  disabled={creditForm.isSubmitting}
                  className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 text-white py-4 rounded-xl font-bold transition-colors"
                >
                  {creditForm.isSubmitting ? 'Отправка...' : 'Получить одобрение'}
                </button>
              </form>
            ) : (
              <SuccessMessage onReset={creditForm.resetForm} />
            )}
          </Modal>
        )}
      </AnimatePresence>

      {/* Chat Widget */}
      <ChatWidget />
    </div>
  )
}

// FAQ Item Component
const FAQItem = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false)
  
  return (
    <div className="bg-slate-900 border border-gray-800 rounded-xl overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-6 flex justify-between items-center text-left hover:bg-gray-800/50 transition-colors"
      >
        <span className="font-bold text-lg pr-4">{question}</span>
        <SafeIcon 
          name={isOpen ? 'chevron-up' : 'chevron-down'} 
          size={24} 
          className="text-orange-500 flex-shrink-0" 
        />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 text-gray-400">
              {answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Modal Component
const Modal = ({ children, onClose, title }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
    onClick={onClose}
  >
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.9, opacity: 0 }}
      className="bg-slate-900 rounded-2xl w-full max-w-md p-6 border border-gray-800"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-black">{title}</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-white">
          <SafeIcon name="x" size={24} />
        </button>
      </div>
      {children}
    </motion.div>
  </motion.div>
)

// Success Message Component
const SuccessMessage = ({ onReset }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    className="text-center py-8"
  >
    <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
      <SafeIcon name="check-circle" size={40} className="text-green-500" />
    </div>
    <h3 className="text-2xl font-bold mb-4">Заявка отправлена!</h3>
    <p className="text-gray-400 mb-6">
      Наш менеджер свяжется с вами в ближайшее время.
    </p>
    <button
      onClick={onReset}
      className="text-orange-500 hover:text-orange-400 font-semibold"
    >
      Отправить еще
    </button>
  </motion.div>
)

export default App