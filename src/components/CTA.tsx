
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { User, Mail, Phone, MessageSquare } from "lucide-react";
import emailjs from 'emailjs-com';
import { toast } from "@/components/ui/sonner";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router-dom";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useLanguage } from "@/context/LanguageContext";

export const CTA = () => {
  const { t } = useLanguage();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Define validation schema with all fields required
  const formSchema = z.object({
    name: z.string().min(2, {
      message: t('validation.name')
    }),
    company: z.string().min(2, {
      message: t('validation.company')
    }),
    email: z.string().email({
      message: t('validation.email')
    }),
    phone: z.string().min(5, {
      message: t('validation.phone')
    }),
    // Now required with minimum length
    message: z.string().min(10, {
      message: t('validation.message')
    })
  });
  
  type FormValues = z.infer<typeof formSchema>;
  
  // Initialize form with react-hook-form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      company: "",
      email: "",
      phone: "",
      message: ""
    }
  });
  
  const handleSubmit = async (data: FormValues) => {
    setSubmitting(true);
    try {
      // Send email using EmailJS with the provided credentials
      const result = await emailjs.send('service_5jqldhy', 'template_n8xowrg', {
        to_email: 'matteo.zoia@encodata.com',
        from_name: data.name,
        from_email: data.email,
        company: data.company,
        phone: data.phone,
        message: data.message
      }, 'QTwBeGH89PjccHI5t');
      
      if (result.text === 'OK') {
        setSubmitted(true);
        form.reset();
        toast.success(t('message.success'));

        // Reset success message after 5 seconds
        setTimeout(() => setSubmitted(false), 5000);
      } else {
        throw new Error('Invio email fallito');
      }
    } catch (error) {
      console.error('Errore durante l\'invio dell\'email:', error);
      toast.error(t('message.error'));
    } finally {
      setSubmitting(false);
    }
  };
  
  return (
    <section id="contattaci" className="py-20 bg-gradient-to-r from-qonneq to-qonneq-dark text-white">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            {t('cta.title')}
          </h2>
          <p className="text-xl text-gray-200 mb-8 max-w-2xl mx-auto">{t('cta.subtitle')}</p>
        </div>
        
        <div className="max-w-2xl mx-auto bg-white/10 backdrop-blur-sm rounded-xl p-6 md:p-8 border border-white/20 shadow-xl">
          {submitted ? (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-qonneq-accent/20 mb-4">
                <svg className="w-8 h-8 text-qonneq-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-2">{t('cta.success.title')}</h3>
              <p className="text-gray-200">{t('cta.success.message')}</p>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField 
                    control={form.control} 
                    name="name" 
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel className="text-white flex items-center gap-2">
                          <User size={18} />
                          {t('cta.form.name')}
                        </FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder={t('cta.form.name.placeholder')} 
                            className="bg-white/10 border-white/20 placeholder:text-white/50 text-white" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField 
                    control={form.control} 
                    name="company" 
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel className="text-white flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          {t('cta.form.company')}
                        </FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder={t('cta.form.company.placeholder')} 
                            className="bg-white/10 border-white/20 placeholder:text-white/50 text-white" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField 
                    control={form.control} 
                    name="email" 
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel className="text-white flex items-center gap-2">
                          <Mail size={18} />
                          {t('cta.form.email')}
                        </FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="email" 
                            placeholder={t('cta.form.email.placeholder')} 
                            className="bg-white/10 border-white/20 placeholder:text-white/50 text-white" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField 
                    control={form.control} 
                    name="phone" 
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel className="text-white flex items-center gap-2">
                          <Phone size={18} />
                          {t('cta.form.phone')}
                        </FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="tel" 
                            placeholder={t('cta.form.phone.placeholder')} 
                            className="bg-white/10 border-white/20 placeholder:text-white/50 text-white" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField 
                  control={form.control} 
                  name="message" 
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-white flex items-center gap-2">
                        <MessageSquare size={18} />
                        {t('cta.form.message')}
                      </FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder={t('cta.form.message.placeholder')} 
                          rows={5} 
                          className="bg-white/10 border-white/20 placeholder:text-white/50 text-white resize-none" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="text-sm text-gray-200 italic">
                  {t('cta.form.privacy')}
                </div>
                
                <div className="text-center">
                  <Button 
                    type="submit" 
                    disabled={submitting} 
                    className="bg-qonneq-accent hover:bg-qonneq-purple w-full md:w-auto px-8 py-6 text-lg font-medium"
                  >
                    {submitting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {t('cta.form.sending')}
                      </>
                    ) : t('cta.form.submit')}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </div>
      </div>
    </section>
  );
};
