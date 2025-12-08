/**
 * LOTTIE TABANLI DOST MASKOT
 * Lottie animasyonları için component
 * Lottie dosyaları: /dost/lottie/ klasöründe olmalı
 */

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import Lottie from 'lottie-react';

type MascotState = 'idle' | 'talking' | 'listening' | 'celebrating';

interface Props {
  state: MascotState;
  size?: number;
}

export default function DostMascotLottie({ state, size = 280 }: Props) {
  const [animationData, setAnimationData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Lottie dosya yolları
  const lottieFiles: Record<MascotState, string> = {
    idle: '/dost/lottie/idle.json',
    talking: '/dost/lottie/talking.json',
    listening: '/dost/lottie/listening.json',
    celebrating: '/dost/lottie/celebrating.json',
  };

  // State değiştiğinde animasyonu yükle
  useEffect(() => {
    const loadAnimation = async () => {
      setLoading(true);
      setError(null);
      setAnimationData(null); // Önce temizle
      
      try {
        const filePath = lottieFiles[state];
        // Cache-busting için timestamp ekle (development için)
        const cacheBuster = import.meta.env.DEV ? `?t=${Date.now()}` : '';
        const fullPath = `${filePath}${cacheBuster}`;
        
        console.log('🎬 Lottie yükleniyor:', fullPath);
        
        const response = await fetch(fullPath, {
          headers: {
            'Accept': 'application/json',
          },
          cache: 'no-cache', // Cache'i bypass et
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('✅ Lottie yüklendi:', data);
        
        // Lottie format kontrolü
        if (!data.v || !data.layers) {
          throw new Error('Geçersiz Lottie formatı');
        }
        
        // Asset path'lerini mutlak URL olarak ayarla ve base64'e çevir
        if (data.assets && data.assets.length > 0) {
          console.log('📦 Assets bulundu:', data.assets.length);
          
          const assetPromises = data.assets.map(async (asset: any) => {
            if (asset.p && asset.u !== undefined && asset.ty === undefined) {
              const assetPath = (asset.u || '/dost/lottie/') + asset.p;
              console.log('🖼️ Asset yükleniyor:', assetPath);
              
              try {
                const response = await fetch(assetPath);
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                const blob = await response.blob();
                const base64 = await new Promise<string>((resolve, reject) => {
                  const reader = new FileReader();
                  reader.onloadend = () => resolve(reader.result as string);
                  reader.onerror = reject;
                  reader.readAsDataURL(blob);
                });
                
                // Base64 data URL'i direkt kullan
                asset.p = base64;
                asset.u = '';
                console.log('✅ Asset base64\'e çevrildi:', asset.id);
              } catch (err) {
                console.error('❌ Asset yükleme hatası:', asset.id, err);
                // Hata durumunda path'i koru
                if (!asset.u || asset.u === '') {
                  asset.u = '/dost/lottie/';
                }
              }
            }
            return asset;
          });
          
          await Promise.all(assetPromises);
        } else {
          console.log('⚠️ Assets bulunamadı veya boş');
        }
        
        console.log('📊 Animation data hazır, layers:', data.layers?.length || 0);
        console.log('📊 Animation boyutları:', { w: data.w, h: data.h });
        console.log('📊 Animation frame sayısı:', data.op - data.ip);
        console.log('📊 Animation assets:', data.assets);
        setAnimationData(data);
      } catch (err: any) {
        console.error('❌ Lottie animasyon yüklenemedi:', err);
        setError(err.message || 'Bilinmeyen hata');
        setAnimationData(null);
      } finally {
        setLoading(false);
      }
    };

    loadAnimation();
  }, [state]);

  // Lottie render kontrolü
  useEffect(() => {
    if (animationData && !loading && !error) {
      console.log('🎨 Lottie render ediliyor, state:', state);
      console.log('🎨 Container boyutu:', size);
      // DOM'da Lottie elementini kontrol et
      setTimeout(() => {
        const lottieElement = document.querySelector('[data-lottie-container]');
        if (lottieElement) {
          console.log('✅ Lottie DOM element bulundu:', lottieElement);
          console.log('📐 Lottie element boyutları:', {
            width: (lottieElement as HTMLElement).offsetWidth,
            height: (lottieElement as HTMLElement).offsetHeight,
          });
          
          // Lottie'nin render ettiği SVG/canvas elementini bul
          const svg = lottieElement.querySelector('svg');
          const canvas = lottieElement.querySelector('canvas');
          if (svg) {
            console.log('✅ SVG element bulundu:', svg);
            console.log('📐 SVG boyutları:', {
              width: svg.offsetWidth,
              height: svg.offsetHeight,
              viewBox: svg.getAttribute('viewBox'),
            });
            
            // SVG içindeki image elementlerini kontrol et
            const images = svg.querySelectorAll('image');
            console.log('🖼️ SVG içindeki image elementleri:', images.length);
            images.forEach((img, idx) => {
              console.log(`  Image ${idx}:`, {
                href: img.getAttribute('href') || img.getAttribute('xlink:href'),
                x: img.getAttribute('x'),
                y: img.getAttribute('y'),
                width: img.getAttribute('width'),
                height: img.getAttribute('height'),
              });
            });
            
            // SVG içindeki tüm child elementleri kontrol et
            const children = Array.from(svg.children);
            console.log('👶 SVG child elementleri:', children.length);
            children.forEach((child, idx) => {
              console.log(`  Child ${idx}:`, child.tagName, {
                id: child.getAttribute('id'),
                class: child.getAttribute('class'),
              });
            });
            
            // SVG içeriğinin ilk 500 karakterini göster
            console.log('📄 SVG innerHTML (ilk 500 karakter):', svg.innerHTML.substring(0, 500));
          } else if (canvas) {
            console.log('✅ Canvas element bulundu:', canvas);
            console.log('📐 Canvas boyutları:', {
              width: canvas.offsetWidth,
              height: canvas.offsetHeight,
            });
          } else {
            console.warn('⚠️ SVG veya Canvas element bulunamadı!');
            console.log('🔍 Container içeriği:', lottieElement.innerHTML.substring(0, 200));
          }
        } else {
          console.warn('⚠️ Lottie DOM element bulunamadı');
        }
      }, 500); // Daha uzun bekle, render tamamlansın
    }
  }, [animationData, loading, error, state, size]);

  // Container animasyonları (Lottie animasyonu dışında ekstra efektler için)
  const containerAnimations = {
    idle: {},
    talking: {},
    listening: {},
    celebrating: {
      scale: [1, 1.1, 1],
      transition: { duration: 0.5, repeat: 2 },
    },
  };

  return (
    <motion.div
      className="absolute bottom-8 right-8 z-50"
      style={{ width: size, height: size }}
      animate={containerAnimations[state]}
      initial={false}
    >
      {loading ? (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg border-2 border-blue-300">
          <div className="text-center p-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-xs text-gray-700 font-semibold">Yükleniyor...</p>
          </div>
        </div>
      ) : error || !animationData ? (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg border-2 border-dashed border-blue-300">
          <div className="text-center p-4">
            <div className="text-4xl mb-2">📦</div>
            <p className="text-xs text-gray-700 font-semibold">Lottie Dosyası Bulunamadı</p>
            <p className="text-xs text-gray-600 mt-1">{lottieFiles[state]}</p>
            <p className="text-xs text-gray-500 mt-2">
              After Effects'ten export edilmiş JSON dosyası gerekli
            </p>
            <p className="text-xs text-gray-400 mt-1 text-center max-w-xs">
              Bodymovin eklentisi ile export edin ve /public/dost/lottie/ klasörüne koyun
            </p>
          </div>
        </div>
      ) : (
        <div 
          className="w-full h-full" 
          data-lottie-container
          style={{ 
            filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.15))',
            minHeight: size,
            minWidth: size,
            position: 'relative',
            overflow: 'hidden',
            backgroundColor: 'transparent', // Şeffaf arka plan
          }}
        >
          <Lottie
            key={state} // Force re-render on state change
            animationData={animationData}
            loop={state !== 'celebrating'}
            autoplay={true}
            initialSegment={[0, 30]}
            style={{ 
              width: size, 
              height: size,
              display: 'block',
              position: 'relative',
              zIndex: 1,
              backgroundColor: 'transparent', // Şeffaf arka plan
            }}
            renderer="svg"
            rendererSettings={{
              preserveAspectRatio: 'xMidYMid meet',
              clearCanvas: true,
              progressiveLoad: false,
              hideOnTransparent: true, // Şeffaf alanları gizle
            }}
            className="lottie-animation"
          />
        </div>
      )}
    </motion.div>
  );
}

