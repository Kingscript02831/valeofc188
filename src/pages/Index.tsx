import { useState } from "react";
import type { Database } from "@/types/supabase";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import NewsCard from "@/components/NewsCard";
import Navbar from "../components/Navbar";
import SubNav from "../components/SubNav";
import Footer from "../components/Footer";
import BottomNav from "../components/BottomNav";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";

type News = Database['public']['Tables']['news']['Row'] & {
  categories: Database['public']['Tables']['categories']['Row'] | null;
};
type Category = Database['public']['Tables']['categories']['Row'];
interface InstagramMedia {
  url: string;
  type: 'post' | 'video';
}

const Index = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories', 'news'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('page_type', 'news')
        .order('name');
      if (error) {
        console.error('Error fetching categories:', error);
        toast.error('Erro ao carregar categorias');
        throw error;
      }
      return data || [];
    }
  });

  const { data: news = [], isLoading, error } = useQuery<News[]>({
    queryKey: ['news', searchTerm, selectedCategory],
    queryFn: async () => {
      try {
        let query = supabase
          .from('news')
          .select('*, categories(*)')
          .order('date', { ascending: false });

        if (searchTerm) {
          query = query.ilike('title', `%${searchTerm}%`);
        }

        if (selectedCategory) {
          query = query.eq('category_id', selectedCategory);
        }

        const { data, error } = await query;
        
        if (error) {
          console.error('Supabase query error:', error);
          toast.error('Erro ao carregar notícias');
          throw error;
        }
        
        console.log('Fetched news data:', data);
        return data as News[];
      } catch (err) {
        console.error('Error fetching news:', err);
        toast.error('Erro ao carregar notícias');
        throw err;
      }
    },
    retry: 1
  });

  return (
    <div className="min-h-screen flex flex-col pb-[72px] md:pb-0">
      <Navbar />
      <SubNav />
      <main className="flex-1 container mx-auto py-8 px-4">
        <div className="flex flex-col gap-8">
          <h1 className="text-3xl font-bold">Últimas Notícias</h1>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 h-4 w-4" />
              <Input
                type="search"
                placeholder="Buscar notícias..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-colors ${
                !selectedCategory
                  ? "bg-[#F1F1F1] text-gray-800 dark:bg-gray-700 dark:text-white"
                  : "bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-200"
              }`}
            >
              Todas
            </button>
            {categories?.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-colors ${
                  selectedCategory === category.id
                    ? "bg-[#F1F1F1] text-gray-800 dark:bg-gray-700 dark:text-white"
                    : "hover:opacity-80"
                }`}
                style={{
                  backgroundColor:
                    selectedCategory === category.id
                      ? "#F1F1F1"
                      : category.background_color + "40" || "#D6BCFA40",
                }}
              >
                {category.name}
              </button>
            ))}
          </div>

          {isLoading ? (
            <p className="text-center py-8">Carregando notícias...</p>
          ) : error ? (
            <p className="text-center py-8 text-red-500">
              Erro ao carregar notícias. Por favor, tente novamente.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {news.map((item) => {
                const instagramMedia = item.instagram_media 
                  ? (typeof item.instagram_media === 'string' 
                      ? JSON.parse(item.instagram_media) 
                      : item.instagram_media) as InstagramMedia[]
                  : [];

                return (
                  <NewsCard
                    key={item.id}
                    title={item.title}
                    content={item.content}
                    date={item.date}
                    createdAt={item.created_at}
                    images={item.images || []}
                    video_urls={item.video_urls || []}
                    instagramMedia={instagramMedia}
                    category={item.categories ? {
                      name: item.categories.name,
                      slug: item.categories.slug,
                      background_color: item.categories.background_color
                    } : null}
                    buttonColor={item.button_color || undefined}
                  />
                );
              })}
              {!isLoading && news.length === 0 && (
                <p className="text-gray-500 col-span-full text-center py-8">
                  Nenhuma notícia encontrada.
                </p>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
      <BottomNav />
      <PWAInstallPrompt />
    </div>
  );
};

export default Index;
