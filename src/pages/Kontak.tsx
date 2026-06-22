import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import {
  MapPin,
  Phone,
  Mail,
  Globe,
  Clock,
  Send,
  MessageCircle,
  Camera,
  ThumbsUp,
  Play,
} from "lucide-react";
import { PageWrapper } from "@/components/layout";
import { Card, CardContent, Button, Input } from "@/components/ui";
import { SCHOOL } from "@/constants/school";
import { toast } from "sonner";

const contactSchema = z.object({
  nama: z.string().min(3, "Nama minimal 3 karakter"),
  email: z.string().email("Format email tidak valid"),
  subjek: z.string().min(5, "Subjek minimal 5 karakter"),
  pesan: z.string().min(20, "Pesan minimal 20 karakter"),
});

type ContactForm = z.infer<typeof contactSchema>;


export default function Kontak() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactForm>({
    resolver: zodResolver(contactSchema),
  });

  const onSubmit = async (data: ContactForm) => {
    // Simulate send
    await new Promise((r) => setTimeout(r, 1500));
    toast.success("Pesan berhasil dikirim!", {
      description: "Kami akan merespons dalam 1-2 hari kerja.",
    });
    reset();
  };

  return (
    <PageWrapper>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-navy/5 flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="h-8 w-8 text-navy" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-navy mb-2">
            Hubungi Kami
          </h1>
          <p className="text-slate-500 max-w-lg mx-auto">
            Punya pertanyaan tentang daftar ulang? Tim kami siap membantu Anda
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Contact Info */}
          <div className="lg:col-span-2 space-y-4">
            <div>
              <Card className="bg-navy-gradient text-white border-none">
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="font-bold text-white text-lg mb-1">Informasi Kontak</h3>
                    <p className="text-white/60 text-sm">Hubungi kami melalui channel berikut</p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                        <MapPin className="h-5 w-5 text-gold" />
                      </div>
                      <div>
                        <p className="text-xs text-white/40 uppercase tracking-wider font-medium">Alamat</p>
                        <p className="text-sm text-white/80 mt-0.5">{SCHOOL.address}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                        <Phone className="h-5 w-5 text-gold" />
                      </div>
                      <div>
                        <p className="text-xs text-white/40 uppercase tracking-wider font-medium">Telepon</p>
                        <p className="text-sm text-white/80 mt-0.5">{SCHOOL.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                        <Mail className="h-5 w-5 text-gold" />
                      </div>
                      <div>
                        <p className="text-xs text-white/40 uppercase tracking-wider font-medium">Email</p>
                        <a href={`mailto:${SCHOOL.email}`} className="text-sm text-white/80 mt-0.5 hover:text-gold transition-colors">
                          {SCHOOL.email}
                        </a>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                        <Globe className="h-5 w-5 text-gold" />
                      </div>
                      <div>
                        <p className="text-xs text-white/40 uppercase tracking-wider font-medium">Website</p>
                        <a href={`https://${SCHOOL.website}`} target="_blank" rel="noopener noreferrer" className="text-sm text-white/80 mt-0.5 hover:text-gold transition-colors">
                          {SCHOOL.website}
                        </a>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                        <Clock className="h-5 w-5 text-gold" />
                      </div>
                      <div>
                        <p className="text-xs text-white/40 uppercase tracking-wider font-medium">Jam Layanan</p>
                        <p className="text-sm text-white/80 mt-0.5">Sen-Jum: 08.00 - 15.00</p>
                        <p className="text-sm text-white/80">Sabtu: 08.00 - 12.00</p>
                      </div>
                    </div>
                  </div>

                  {/* Social */}
                  <div className="pt-4 border-t border-white/10">
                    <p className="text-xs text-white/40 uppercase tracking-wider font-medium mb-3">Sosial Media</p>
                    <div className="flex gap-3">
                      <a href="https://instagram.com/smkn5kotaserang" target="_blank" rel="noopener noreferrer"
                        className="w-10 h-10 rounded-xl bg-white/10 hover:bg-gold/20 flex items-center justify-center transition-colors group" aria-label="Instagram">
                        <Camera className="h-5 w-5 text-white/60 group-hover:text-gold transition-colors" />
                      </a>
                      <a href="https://facebook.com/smkn5kotaserang" target="_blank" rel="noopener noreferrer"
                        className="w-10 h-10 rounded-xl bg-white/10 hover:bg-gold/20 flex items-center justify-center transition-colors group" aria-label="Facebook">
                        <ThumbsUp className="h-5 w-5 text-white/60 group-hover:text-gold transition-colors" />
                      </a>
                      <a href="https://youtube.com/@smkn5kotaserang" target="_blank" rel="noopener noreferrer"
                        className="w-10 h-10 rounded-xl bg-white/10 hover:bg-gold/20 flex items-center justify-center transition-colors group" aria-label="YouTube">
                        <Play className="h-5 w-5 text-white/60 group-hover:text-gold transition-colors" />
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-3">
            <div>
              <Card>
                <CardContent>
                  <h3 className="font-bold text-navy text-lg mb-1">Kirim Pesan</h3>
                  <p className="text-sm text-slate-400 mb-6">
                    Isi formulir di bawah ini dan kami akan merespons secepat mungkin
                  </p>

                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <Input
                        label="Nama Lengkap"
                        placeholder="Nama Anda"
                        {...register("nama")}
                        error={errors.nama?.message}
                        required
                      />
                      <Input
                        label="Email"
                        type="email"
                        placeholder="email@contoh.com"
                        {...register("email")}
                        error={errors.email?.message}
                        required
                      />
                    </div>
                    <Input
                      label="Subjek"
                      placeholder="Perihal pertanyaan Anda"
                      {...register("subjek")}
                      error={errors.subjek?.message}
                      required
                    />
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-slate-700">
                        Pesan <span className="text-danger ml-0.5">*</span>
                      </label>
                      <textarea
                        rows={5}
                        placeholder="Tulis pesan atau pertanyaan Anda di sini..."
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 transition-all duration-200 hover:border-navy/30 focus:border-navy focus:ring-2 focus:ring-navy/10 focus:outline-none resize-none"
                        {...register("pesan")}
                      />
                      {errors.pesan && (
                        <p className="text-xs text-danger font-medium">{errors.pesan.message}</p>
                      )}
                    </div>
                    <Button
                      type="submit"
                      variant="primary"
                      size="lg"
                      className="w-full"
                      isLoading={isSubmitting}
                      rightIcon={<Send className="h-4 w-4" />}
                    >
                      Kirim Pesan
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Map placeholder */}
        <div className="mt-8">
          <Card className="overflow-hidden p-0">
            <div className="aspect-21/6 bg-navy/5 flex items-center justify-center relative">
              <iframe
                title="Lokasi SMKN 5 Kota Serang"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3966.0!2d106.14!3d-6.13!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNsKwMDgnMDAuMCJTIDEwNsKwMDgnMDAuMCJF!5e0!3m2!1sid!2sid!4v1000000000000"
                className="absolute inset-0 w-full h-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
              <div className="absolute inset-0 bg-navy/5 pointer-events-none" />
            </div>
          </Card>
        </div>
      </div>
    </PageWrapper>
  );
}
