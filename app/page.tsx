"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { isAdmin } from "@/lib/auth"

const menuItems = [
  { label: "Tentang", href: "#tentang" },
  { label: "Fasilitas", href: "#fasilitas" },
  { label: "Produk", href: "#produk" },
  { label: "Riwayat", href: "/reservasi/riwayat" },
] as const

const fasilitasItems = [
  {
    title: "Laboratorium Hidroponik",
    description:
      "Eksplorasi sistem budidaya modern berbasis air untuk pembelajaran pertanian presisi.",
    icon: "LH",
  },
  {
    title: "Greenhouse",
    description:
      "Area tanam terkendali untuk riset tanaman dan praktik agrikultur berkelanjutan.",
    icon: "GH",
  },
  {
    title: "Kebun Organik",
    description:
      "Lahan edukatif untuk teknik budidaya organik ramah lingkungan dan sehat.",
    icon: "KO",
  },
  {
    title: "Laboratorium Bioteknologi",
    description:
      "Fasilitas riset inovasi bioteknologi untuk pengembangan ilmu dan aplikasi agribisnis.",
    icon: "LB",
  },
] as const

const langkahReservasi = [
  {
    step: "1",
    title: "Isi Form Reservasi",
    description: "Lengkapi data kunjungan melalui form online dengan mudah.",
  },
  {
    step: "2",
    title: "Tunggu Konfirmasi",
    description: "Tim ATP IPB akan meninjau pengajuan dan mengirim konfirmasi.",
  },
  {
    step: "3",
    title: "Kunjungi ATP IPB",
    description: "Datang sesuai jadwal untuk pengalaman kunjungan yang terarah.",
  },
] as const

export default function HomePage() {
  const router = useRouter()
  const [activeSection, setActiveSection] = useState("tentang")
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [isAdminUser, setIsAdminUser] = useState(false)
  const [authLoading, setAuthLoading] = useState(true)

  useEffect(() => {
    const sections = ["tentang", "fasilitas", "produk"]
      .map((id) => document.getElementById(id))
      .filter((section): section is HTMLElement => section !== null)

    const onScroll = () => {
      const viewportPoint = window.scrollY + 120
      let current = "tentang"

      for (const section of sections) {
        if (viewportPoint >= section.offsetTop) {
          current = section.id
        }
      }

      setActiveSection(current)
    }

    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => {
    const syncUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      const email = user?.email ?? null
      setUserEmail(email)
      setIsAdminUser(email ? isAdmin(email) : false)
      setAuthLoading(false)
    }

    void syncUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const email = session?.user.email ?? null
      setUserEmail(email)
      setIsAdminUser(email ? isAdmin(email) : false)
      setAuthLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleReservasi = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
        redirectTo: `${window.location.origin}/auth/callback`,
       },
    })
    } else {
      window.location.href = "/reservasi"
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: "http://localhost:3000/auth/callback",
      },
    })
  }

  const handleAdminRedirect = () => {
    console.log("redirecting to admin...")
    router.push("/admin/reservasi")
  }

  return (
    <main id="beranda" className="min-h-screen bg-slate-50 text-slate-800">
      <style jsx global>{`
        html {
          scroll-behavior: smooth;
        }
      `}</style>

      <header className="sticky top-0 z-50 border-b border-blue-800 bg-blue-900 text-white shadow-md">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-6 px-4 py-4 sm:px-6">
          <Link href="/" className="leading-tight">
            <p className="text-2xl font-bold tracking-tight">ATP IPB University</p>
            <p className="text-sm text-blue-100">Agribusiness and Technology Park</p>
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            {menuItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className={`text-lg font-medium underline-offset-8 transition duration-200 hover:text-white hover:underline ${
                  activeSection === item.href.replace("#", "")
                    ? "text-white underline"
                    : "text-blue-100"
                }`}
              >
                {item.label}
              </a>
            ))}

            <button
              type="button"
              onClick={() => void handleReservasi()}
              className="rounded-lg bg-white px-3 py-1.5 text-sm font-semibold text-blue-900 transition hover:bg-blue-100"
            >
              Reservasi
            </button>

            {userEmail ? (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-blue-100">{userEmail}</span>
                  {isAdminUser ? (
                    <span className="rounded-full bg-blue-200 px-2 py-0.5 text-[10px] font-semibold text-blue-900">
                      Admin
                    </span>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => void handleLogout()}
                  className="rounded-lg border border-blue-200 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-blue-800"
                >
                  Logout
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => void handleGoogleLogin()}
                className="rounded-lg bg-blue-700 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-blue-800"
              >
                Login with Google
              </button>
            )}
          </nav>
        </div>
      </header>

      <section className="bg-gradient-to-b from-blue-50 to-slate-50">
        <div className="mx-auto w-full max-w-6xl px-4 py-20 text-center sm:px-6">
          {authLoading ? null : isAdminUser ? (
            <div className="mx-auto mb-8 w-full max-w-3xl rounded-xl border border-slate-200 bg-white p-6 text-left shadow-lg">
              <h2 className="text-2xl font-bold text-blue-900">Admin Dashboard</h2>
              <p className="mt-2 text-sm text-slate-600">
                Kelola reservasi, approve/reject, dan monitor aktivitas
              </p>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={handleAdminRedirect}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Buka Admin Dashboard
                </button>
              </div>
            </div>
          ) : null}

          <h1 className="text-4xl font-bold leading-tight text-blue-900 sm:text-5xl">
            Reservasi Kunjungan ATP IPB
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-slate-600 sm:text-lg">
            Sistem reservasi online untuk kunjungan Agribusiness and Technology Park
            IPB.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={() => void handleReservasi()}
              className="inline-flex rounded-lg bg-blue-700 px-6 py-3 text-sm font-semibold text-white shadow transition-all hover:scale-105 hover:bg-blue-800"
            >
              Reservasi Sekarang
            </button>
            <Link
              href="/reservasi/riwayat"
              className="inline-flex rounded-lg border border-blue-600 px-6 py-3 text-sm font-semibold text-blue-700 transition-all hover:scale-105 hover:bg-blue-100"
            >
              Cek Riwayat Reservasi
            </Link>
          </div>
        </div>
      </section>

      <section id="tentang" className="mx-auto w-full max-w-6xl scroll-mt-24 px-4 py-16 sm:px-6">
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
          <h2 className="text-2xl font-bold text-blue-900">Tentang ATP IPB</h2>
          <p className="mt-3 text-slate-600">
            ATP IPB adalah pusat pengembangan agribisnis dan teknologi yang
            mengintegrasikan pembelajaran, riset, dan implementasi inovasi untuk
            masyarakat.
          </p>
          <ul className="mt-5 space-y-2 text-slate-700">
            <li>- Sarana edukasi pertanian modern untuk pelajar, mahasiswa, dan umum.</li>
            <li>- Fasilitas penelitian terapan untuk inovasi agribisnis berkelanjutan.</li>
            <li>- Destinasi wisata edukatif berbasis teknologi dan lingkungan.</li>
          </ul>
        </div>
      </section>

      <section id="fasilitas" className="mx-auto w-full max-w-6xl scroll-mt-24 px-4 py-4 sm:px-6">
        <h2 className="text-center text-2xl font-bold text-blue-900">Fasilitas Unggulan</h2>
        <p className="mx-auto mt-2 max-w-2xl text-center text-slate-600">
          Jelajahi fasilitas utama ATP IPB untuk kunjungan edukatif dan penelitian.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {fasilitasItems.map((item) => (
            <article
              key={item.title}
              className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-sm font-bold text-blue-800">
                {item.icon}
              </div>
              <h3 className="mt-4 text-base font-semibold text-slate-900">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="produk" className="mx-auto w-full max-w-6xl scroll-mt-24 px-4 py-16 sm:px-6">
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
          <h2 className="text-2xl font-bold text-blue-900">Produk ATP IPB</h2>
          <p className="mt-3 text-slate-600">
            Section produk akan menampilkan katalog produk unggulan ATP IPB.
            Konten detail produk bisa ditambahkan pada tahap berikutnya.
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="text-center text-2xl font-bold text-blue-900">Cara Reservasi</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {langkahReservasi.map((item) => (
            <article
              key={item.step}
              className="rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-slate-200"
            >
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-blue-700 text-sm font-semibold text-white">
                {item.step}
              </div>
              <h3 className="mt-4 text-lg font-semibold text-slate-900">{item.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="kontak" className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6">
        <div className="rounded-2xl bg-blue-900 p-6 text-blue-50 shadow-sm sm:p-8">
          <h2 className="text-2xl font-bold">Kontak ATP IPB</h2>
          <div className="mt-4 grid gap-4 text-sm sm:grid-cols-3">
            <p>
              <span className="font-semibold">Alamat:</span> Jl. Raya Dramaga, Kampus IPB
              Dramaga, Bogor 16680, Jawa Barat
            </p>
            <p>
              <span className="font-semibold">Telepon:</span> (0251) 8628448
            </p>
            <p>
              <span className="font-semibold">Email:</span> atp@ipb.ac.id
            </p>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-6 text-center text-sm text-slate-500 sm:px-6">
          {new Date().getFullYear()} ATP IPB Reservation System. All rights reserved.
        </div>
      </footer>
    </main>
  )
}