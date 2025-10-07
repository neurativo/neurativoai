import { render, screen, fireEvent } from '@testing-library/react'
import Home from '../page'

// Mock the TypingText component
jest.mock('../components/TypingText', () => {
  return function MockTypingText({ texts }: { texts: string[] }) {
    return <span>{texts[0]}</span>
  }
})

describe('Home Page', () => {
  beforeEach(() => {
    render(<Home />)
  })

  it('renders the main heading', () => {
    expect(screen.getByText('Transform Learning with AI')).toBeInTheDocument()
  })

  it('renders the hero description', () => {
    expect(screen.getByText(/Experience the future of education/)).toBeInTheDocument()
  })

  it('renders call-to-action buttons', () => {
    expect(screen.getByText('Start Learning Free')).toBeInTheDocument()
    expect(screen.getByText('View Pricing')).toBeInTheDocument()
  })

  it('renders trust indicators', () => {
    expect(screen.getByText('100% Secure')).toBeInTheDocument()
    expect(screen.getByText('10K+ Active Users')).toBeInTheDocument()
    expect(screen.getByText('4.9/5 Rating')).toBeInTheDocument()
  })

  it('renders features section', () => {
    expect(screen.getByText('Why Choose Neurativo?')).toBeInTheDocument()
    expect(screen.getByText('AI-Powered Intelligence')).toBeInTheDocument()
    expect(screen.getByText('Smart Analytics')).toBeInTheDocument()
    expect(screen.getByText('Gamified Learning')).toBeInTheDocument()
  })

  it('renders stats section', () => {
    expect(screen.getByText('Trusted by Learners Worldwide')).toBeInTheDocument()
    expect(screen.getByText('10K+')).toBeInTheDocument()
    expect(screen.getByText('50K+')).toBeInTheDocument()
    expect(screen.getByText('95%')).toBeInTheDocument()
    expect(screen.getByText('24/7')).toBeInTheDocument()
  })

  it('renders how it works section', () => {
    expect(screen.getByText('How It Works')).toBeInTheDocument()
    expect(screen.getByText('Upload Content')).toBeInTheDocument()
    expect(screen.getByText('AI Processing')).toBeInTheDocument()
    expect(screen.getByText('Start Learning')).toBeInTheDocument()
  })

  it('renders testimonials section', () => {
    expect(screen.getByText('Success Stories')).toBeInTheDocument()
    expect(screen.getByText('Sarah Chen')).toBeInTheDocument()
    expect(screen.getByText('Michael Rodriguez')).toBeInTheDocument()
    expect(screen.getByText('Emily Johnson')).toBeInTheDocument()
  })

  it('renders final CTA section', () => {
    expect(screen.getByText('Transform Your Learning')).toBeInTheDocument()
    expect(screen.getByText('Today')).toBeInTheDocument()
  })

  it('has proper accessibility attributes', () => {
    const ctaButtons = screen.getAllByText('Start Learning Free')
    ctaButtons.forEach(button => {
      expect(button.closest('a')).toHaveAttribute('href', '/quiz')
    })
  })

  it('displays star ratings in testimonials', () => {
    const starIcons = screen.getAllByRole('img', { hidden: true })
    expect(starIcons.length).toBeGreaterThan(0)
  })
})
