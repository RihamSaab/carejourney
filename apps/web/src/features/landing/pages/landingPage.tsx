import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Activity,
  Calendar,
  ClipboardList,
  FileText,
  HeartPulse,
  Lock,
  Pill,
  Stethoscope,
  Users,
} from 'lucide-react';
import styled from 'styled-components';

import { useAuthStore } from '@/features/auth';
import { Button } from '@/shared/components/button';
import { Icon } from '@/shared/components/icon';

export const LandingPage = () => {
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.currentUser);
  const isHydrating = useAuthStore((state) => state.isHydrating);

  useEffect(() => {
    if (!isHydrating && currentUser) {
      void navigate('/dashboard', { replace: true });
    }
  }, [currentUser, isHydrating, navigate]);

  return (
    <Page>
      <TopBar>
        <Brand>
          <Icon icon={HeartPulse} size="md" />
          <span>CareJourney</span>
        </Brand>
        <TopActions>
          <Link to="/login">
            <Button variant="ghost">Sign in</Button>
          </Link>
          <Link to="/register">
            <Button>Create account</Button>
          </Link>
        </TopActions>
      </TopBar>

      <Hero>
        <Eyebrow>Healthcare coordination platform</Eyebrow>
        <Headline>
          Turn every care plan into a clear, trackable journey.
        </Headline>
        <HeroSub>
          One place for appointments, medications, tasks, lab results and documents — connecting
          patients with their authorized healthcare professionals.
        </HeroSub>
        <HeroActions>
          <Link to="/register">
            <Button size="lg">Create your account</Button>
          </Link>
          <Link to="/login">
            <Button size="lg" variant="secondary">
              I already have an account
            </Button>
          </Link>
        </HeroActions>
        <HeroNote>Free during the pilot. No credit card required.</HeroNote>
      </Hero>

      <Section id="what-it-does">
        <SectionHeader>
          <SectionTitle>What is CareJourney?</SectionTitle>
          <SectionLead>
            After a consultation, patients leave with prescriptions, lab requests, follow-up tasks
            and documents scattered across paper, messages and memory. CareJourney stitches them
            into a single, action-oriented journey so nothing gets lost between visits.
          </SectionLead>
        </SectionHeader>
        <QuestionCard>
          <QuestionBlock>
            <QuestionLabel>Patients always know</QuestionLabel>
            <QuestionList>
              <li>What happened at the last visit</li>
              <li>What they need to do today</li>
              <li>What is coming next</li>
            </QuestionList>
          </QuestionBlock>
          <QuestionBlock>
            <QuestionLabel>Professionals always know</QuestionLabel>
            <QuestionList>
              <li>Where the patient is in their care plan</li>
              <li>What was completed and what was missed</li>
              <li>Which actions still need their attention</li>
            </QuestionList>
          </QuestionBlock>
        </QuestionCard>
      </Section>

      <Section id="features">
        <SectionHeader>
          <SectionTitle>Everything in one connected journey</SectionTitle>
          <SectionLead>
            Each feature feeds the same timeline — no more switching tabs to piece together a
            patient&apos;s story.
          </SectionLead>
        </SectionHeader>
        <FeatureGrid>
          <FeatureCard>
            <FeatureIcon>
              <Icon icon={ClipboardList} size="md" />
            </FeatureIcon>
            <FeatureTitle>Care plans</FeatureTitle>
            <FeatureBody>
              Professionals create the plan. Patients see exactly what it means for their daily
              life.
            </FeatureBody>
          </FeatureCard>
          <FeatureCard>
            <FeatureIcon>
              <Icon icon={Pill} size="md" />
            </FeatureIcon>
            <FeatureTitle>Medications & reminders</FeatureTitle>
            <FeatureBody>
              Each dose becomes a scheduled event patients can mark as taken, skipped, or missed.
            </FeatureBody>
          </FeatureCard>
          <FeatureCard>
            <FeatureIcon>
              <Icon icon={Activity} size="md" />
            </FeatureIcon>
            <FeatureTitle>Tasks & follow-ups</FeatureTitle>
            <FeatureBody>
              Clear next actions with due dates and priorities — nothing slips between
              appointments.
            </FeatureBody>
          </FeatureCard>
          <FeatureCard>
            <FeatureIcon>
              <Icon icon={Calendar} size="md" />
            </FeatureIcon>
            <FeatureTitle>Appointments</FeatureTitle>
            <FeatureBody>
              Request, confirm, reschedule or cancel visits in context of the full care plan.
            </FeatureBody>
          </FeatureCard>
          <FeatureCard>
            <FeatureIcon>
              <Icon icon={FileText} size="md" />
            </FeatureIcon>
            <FeatureTitle>Documents & labs</FeatureTitle>
            <FeatureBody>
              Reports, prescriptions and lab results travel with the patient — accessible to anyone
              they trust.
            </FeatureBody>
          </FeatureCard>
          <FeatureCard>
            <FeatureIcon>
              <Icon icon={Users} size="md" />
            </FeatureIcon>
            <FeatureTitle>Care team & caregivers</FeatureTitle>
            <FeatureBody>
              Patients decide which professionals and family members can see what — permissions are
              theirs to grant and revoke.
            </FeatureBody>
          </FeatureCard>
        </FeatureGrid>
      </Section>

      <Section id="who-its-for">
        <SectionHeader>
          <SectionTitle>Built for both sides of the visit</SectionTitle>
        </SectionHeader>
        <RoleGrid>
          <RoleCard>
            <RoleIcon>
              <Icon icon={HeartPulse} size="md" />
            </RoleIcon>
            <RoleTitle>For patients</RoleTitle>
            <RoleBody>
              Understand your treatment, track your medications and appointments, keep every
              document in one place, and share access with family or doctors when it matters.
            </RoleBody>
            <RoleList>
              <li>Personal care journey</li>
              <li>Medication reminders you can act on</li>
              <li>One place for every document</li>
              <li>Control who sees what</li>
            </RoleList>
          </RoleCard>
          <RoleCard>
            <RoleIcon>
              <Icon icon={Stethoscope} size="md" />
            </RoleIcon>
            <RoleTitle>For healthcare professionals</RoleTitle>
            <RoleBody>
              Create care plans that patients actually follow. See adherence, outstanding tasks,
              and upcoming visits for every patient in a glance.
            </RoleBody>
            <RoleList>
              <li>Multi-patient dashboard</li>
              <li>Structured care plans with medications & tasks</li>
              <li>Full patient timeline</li>
              <li>Permission-safe collaboration</li>
            </RoleList>
          </RoleCard>
        </RoleGrid>
      </Section>

      <PrivacyBand>
        <Icon icon={Lock} size="md" />
        <PrivacyText>
          <strong>Privacy by design.</strong> CareJourney does not diagnose or prescribe. Patients
          grant access — professionals only see what the patient has authorized, and every action
          is auditable.
        </PrivacyText>
      </PrivacyBand>

      <FinalCta>
        <FinalCtaTitle>Ready to see your care in one place?</FinalCtaTitle>
        <FinalCtaBody>
          Create an account to start your journey. Already registered? Sign in to pick up where you
          left off.
        </FinalCtaBody>
        <HeroActions>
          <Link to="/register">
            <Button size="lg">Create your account</Button>
          </Link>
          <Link to="/login">
            <Button size="lg" variant="secondary">
              Sign in
            </Button>
          </Link>
        </HeroActions>
      </FinalCta>

      <Footer>
        <span>© {new Date().getFullYear()} CareJourney</span>
        <FooterLinks>
          <Link to="/login">Sign in</Link>
          <Link to="/register">Create account</Link>
        </FooterLinks>
      </Footer>
    </Page>
  );
};

const Page = styled.div`
  min-height: 100vh;
  background: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.foreground};
`;

const TopBar = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${({ theme }) => `${theme.spacing.md} ${theme.spacing.lg}`};
  max-width: 72rem;
  margin: 0 auto;
`;

const Brand = styled.div`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  color: ${({ theme }) => theme.colors.primary};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
`;

const TopActions = styled.nav`
  display: inline-flex;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const Hero = styled.section`
  max-width: 56rem;
  margin: 0 auto;
  padding: ${({ theme }) => `${theme.spacing['3xl']} ${theme.spacing.lg} ${theme.spacing['2xl']}`};
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
`;

const Eyebrow = styled.span`
  display: inline-block;
  padding: ${({ theme }) => `${theme.spacing.xs} ${theme.spacing.md}`};
  border-radius: ${({ theme }) => theme.radii.full};
  background: ${({ theme }) => theme.colors.accent};
  color: ${({ theme }) => theme.colors.accentForeground};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
`;

const Headline = styled.h1`
  font-size: ${({ theme }) => theme.typography.fontSize['4xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  line-height: 1.1;
`;

const HeroSub = styled.p`
  max-width: 42rem;
  color: ${({ theme }) => theme.colors.mutedForeground};
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
`;

const HeroActions = styled.div`
  display: inline-flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-top: ${({ theme }) => theme.spacing.sm};
`;

const HeroNote = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.mutedForeground};
`;

const Section = styled.section`
  max-width: 72rem;
  margin: 0 auto;
  padding: ${({ theme }) => `${theme.spacing['2xl']} ${theme.spacing.lg}`};
`;

const SectionHeader = styled.div`
  max-width: 42rem;
  margin: 0 auto ${({ theme }) => theme.spacing.xl};
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const SectionTitle = styled.h2`
  font-size: ${({ theme }) => theme.typography.fontSize['3xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
`;

const SectionLead = styled.p`
  color: ${({ theme }) => theme.colors.mutedForeground};
  font-size: ${({ theme }) => theme.typography.fontSize.base};
`;

const QuestionCard = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${({ theme }) => theme.spacing.lg};
  padding: ${({ theme }) => theme.spacing.xl};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ theme }) => theme.colors.card};

  ${({ theme }) => theme.media.md} {
    grid-template-columns: 1fr 1fr;
  }
`;

const QuestionBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const QuestionLabel = styled.h3`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.primary};
`;

const QuestionList = styled.ul`
  list-style: disc;
  padding-left: ${({ theme }) => theme.spacing.lg};
  color: ${({ theme }) => theme.colors.foreground};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
`;

const FeatureGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${({ theme }) => theme.spacing.md};

  ${({ theme }) => theme.media.sm} {
    grid-template-columns: 1fr 1fr;
  }
  ${({ theme }) => theme.media.lg} {
    grid-template-columns: 1fr 1fr 1fr;
  }
`;

const FeatureCard = styled.article`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.lg};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ theme }) => theme.colors.card};
`;

const FeatureIcon = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.accent};
  color: ${({ theme }) => theme.colors.accentForeground};
`;

const FeatureTitle = styled.h3`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
`;

const FeatureBody = styled.p`
  color: ${({ theme }) => theme.colors.mutedForeground};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

const RoleGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${({ theme }) => theme.spacing.lg};

  ${({ theme }) => theme.media.md} {
    grid-template-columns: 1fr 1fr;
  }
`;

const RoleCard = styled.article`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.xl};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ theme }) => theme.colors.card};
`;

const RoleIcon = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  border-radius: ${({ theme }) => theme.radii.full};
  background: ${({ theme }) => theme.colors.accent};
  color: ${({ theme }) => theme.colors.accentForeground};
`;

const RoleTitle = styled.h3`
  font-size: ${({ theme }) => theme.typography.fontSize.xl};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
`;

const RoleBody = styled.p`
  color: ${({ theme }) => theme.colors.mutedForeground};
`;

const RoleList = styled.ul`
  list-style: disc;
  padding-left: ${({ theme }) => theme.spacing.lg};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
`;

const PrivacyBand = styled.aside`
  max-width: 72rem;
  margin: 0 auto;
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.lg};
  margin: ${({ theme }) => `${theme.spacing.lg} auto`};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ theme }) => theme.colors.accent};
  color: ${({ theme }) => theme.colors.accentForeground};
`;

const PrivacyText = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};
`;

const FinalCta = styled.section`
  max-width: 56rem;
  margin: ${({ theme }) => theme.spacing['2xl']} auto;
  padding: ${({ theme }) => theme.spacing['2xl']};
  border-radius: ${({ theme }) => theme.radii.lg};
  background: linear-gradient(
    135deg,
    ${({ theme }) => theme.colors.primary},
    ${({ theme }) => theme.colors.accentForeground}
  );
  color: ${({ theme }) => theme.colors.primaryForeground};
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const FinalCtaTitle = styled.h2`
  font-size: ${({ theme }) => theme.typography.fontSize['2xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
`;

const FinalCtaBody = styled.p`
  max-width: 36rem;
  opacity: 0.9;
`;

const Footer = styled.footer`
  max-width: 72rem;
  margin: 0 auto;
  padding: ${({ theme }) => `${theme.spacing.lg} ${theme.spacing.lg} ${theme.spacing['2xl']}`};
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: ${({ theme }) => theme.colors.mutedForeground};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`;

const FooterLinks = styled.div`
  display: inline-flex;
  gap: ${({ theme }) => theme.spacing.md};

  a {
    color: ${({ theme }) => theme.colors.primary};
  }
`;
