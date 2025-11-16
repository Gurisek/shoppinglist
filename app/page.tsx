import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="container mx-auto px-4 py-24">
        <div className="max-w-xl mx-auto">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="text-center">
              <div className="mx-auto mb-2 w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center">
                <ShoppingCart className="h-6 w-6 text-yellow-500" />
              </div>
              <CardTitle className="text-3xl font-bold">
                Shopping list app
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-center gap-3">
              <Link href="/auth/login">
                <Button className="bg-yellow-500 text-black hover:bg-yellow-400">
                  Login
                </Button>
              </Link>
              <Link href="/auth/register">
                <Button variant="secondary" className="border-zinc-700">
                  Register
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
