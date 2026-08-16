import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export function HomePage() {
  return (
    <div className="w-full max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>BoltAssignment</CardTitle>
          <CardDescription>
            Register for an OTP, then complete checkout.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 sm:flex-row">
          <Button asChild className="flex-1">
            <Link to="/register">Register</Link>
          </Button>
          <Button asChild variant="outline" className="flex-1">
            <Link to="/checkout">Checkout</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
