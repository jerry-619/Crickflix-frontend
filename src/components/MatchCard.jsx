import { Box, Image, Heading, Text, Badge, LinkBox, LinkOverlay, Flex, useToast, HStack, Avatar } from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { useState, useEffect } from 'react';
import moment from 'moment';
import { Helmet } from 'react-helmet-async';

const MatchCard = ({ match }) => {
  const [timeLeft, setTimeLeft] = useState('');
  const toast = useToast();

  const getStatusColor = (status) => {
    switch (status) {
      case 'live':
        return 'red';
      case 'upcoming':
        return 'blue';
      case 'completed':
        return 'green';
      default:
        return 'gray';
    }
  };

  const calculateTimeLeft = () => {
    if (match.status !== 'upcoming' || !match.scheduledTime) return '';
    
    const now = new Date().getTime();
    const matchTime = new Date(match.scheduledTime).getTime();
    const difference = matchTime - now;
    
    if (difference <= 0) return 'Starting soon';
    
    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}d ${hours}h left`;
    if (hours > 0) return `${hours}h ${minutes}m left`;
    return `${minutes}m left`;
  };

  const getLocalTime = () => {
    if (!match.scheduledTime) return '';
    return moment(match.scheduledTime).local().format('DD MMM, hh:mm A');
  };

  useEffect(() => {
    if (match.status === 'upcoming' && match.scheduledTime) {
      const timer = setInterval(() => {
        setTimeLeft(calculateTimeLeft());
      }, 60000); // Update every minute
      
      setTimeLeft(calculateTimeLeft());
      
      return () => clearInterval(timer);
    }
  }, [match.status, match.scheduledTime]);

  const handleCompletedClick = (e) => {
    if (match.status === 'completed') {
      e.preventDefault();
      toast({
        title: 'Match Completed',
        description: 'This match has ended and is no longer available for viewing.',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Format match time for schema
  const formatSchemaData = () => {
    const startDate = match.scheduledTime ? new Date(match.scheduledTime).toISOString() : '';
    const endDate = match.scheduledTime ? 
      new Date(new Date(match.scheduledTime).getTime() + (4 * 60 * 60 * 1000)).toISOString() : '';

    const matchVenue = match.venue || 'IPL 2025 Stadium';
    const matchCity = match.city || 'India';

    const getEventStatus = () => {
      switch (match.status) {
        case 'live':
          return 'https://schema.org/EventLive';
        case 'completed':
          return 'https://schema.org/EventScheduled';
        case 'upcoming':
          return 'https://schema.org/EventScheduled';
        default:
          return 'https://schema.org/EventScheduled';
      }
    };

    return {
      "@context": "https://schema.org",
      "@type": "SportsEvent",
      "name": match.title || `${match.team1?.name} vs ${match.team2?.name}`,
      "startDate": startDate,
      "endDate": endDate,
      "eventStatus": getEventStatus(),
      "location": {
        "@type": "Place",
        "name": matchVenue,
        "address": {
          "@type": "PostalAddress",
          "addressLocality": matchCity,
          "addressCountry": "IN"
        }
      },
      "description": match.description || 
        `Watch ${match.team1?.name} vs ${match.team2?.name} live cricket match streaming on Crickflix. IPL 2025 live coverage from ${matchVenue}, ${matchCity}.`,
      "organizer": {
        "@type": "Organization",
        "name": "Board of Control for Cricket in India (BCCI)",
        "url": "https://www.iplt20.com"
      },
      "performer": [
        {
          "@type": "SportsTeam",
          "name": match.team1?.name || match.team1,
          "image": match.team1?.logo || match.team1Logo
        },
        {
          "@type": "SportsTeam",
          "name": match.team2?.name || match.team2,
          "image": match.team2?.logo || match.team2Logo
        }
      ],
      "eventAttendanceMode": "https://schema.org/OnlineEventAttendanceMode",
      "image": [
        match.thumbnail || 
        match.team1?.logo || 
        match.team1Logo || 
        "https://crickflix.vercel.app/cricket-default.jpg"
      ],
      "offers": {
        "@type": "Offer",
        "url": `https://crickflix.vercel.app/match/${match._id}`,
        "price": "0",
        "priceCurrency": "INR",
        "availability": "https://schema.org/InStock",
        "validFrom": startDate
      },
      "sport": "Cricket",
      "competitor": [
        {
          "@type": "SportsTeam",
          "name": match.team1?.name || match.team1
        },
        {
          "@type": "SportsTeam",
          "name": match.team2?.name || match.team2
        }
      ]
    };
  };

  return (
    <>
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify(formatSchemaData())}
        </script>
      </Helmet>

      <LinkBox
        as="article"
        borderWidth="1px"
        borderRadius="lg"
        overflow="hidden"
        transition="transform 0.2s"
        _hover={{
          transform: match.status !== 'completed' ? 'scale(1.02)' : 'none',
          shadow: match.status !== 'completed' ? 'lg' : 'none',
        }}
        opacity={match.status === 'completed' ? 0.7 : 1}
        cursor={match.status === 'completed' ? 'not-allowed' : 'pointer'}
      >
        <Box position="relative">
          <Image
            src={match.thumbnail || 'https://via.placeholder.com/400x200?text=Cricket+Match'}
            alt={match.title}
            width="100%"
            height="200px"
            objectFit="cover"
          />
          {match.isLive && (
            <Badge
              position="absolute"
              top={2}
              right={2}
              colorScheme="red"
              variant="solid"
              px={3}
              py={1}
              borderRadius="full"
            >
              LIVE NOW
            </Badge>
          )}
          {match.status === 'upcoming' && timeLeft && (
            <Badge
              position="absolute"
              top={2}
              right={2}
              colorScheme="blue"
              variant="solid"
              px={3}
              py={1}
              borderRadius="full"
            >
              {timeLeft}
            </Badge>
          )}
        </Box>
        
        <Box p={4}>
          <Flex justify="space-between" align="center" mb={2}>
            <Badge colorScheme={getStatusColor(match.status)} variant="subtle">
              {match.status.toUpperCase()}
            </Badge>
            {match.views > 0 && (
              <Text fontSize="sm" color="gray.600">
                {match.views} views
              </Text>
            )}
          </Flex>

          <LinkOverlay 
            as={RouterLink} 
            to={`/match/${match._id}`}
            onClick={handleCompletedClick}
          >
            <Heading size="md" mb={2}>
              {match.title}
            </Heading>
          </LinkOverlay>

          {match.status === 'upcoming' && (
            <Text fontSize="sm" color="gray.600" mb={2}>
              {getLocalTime()}
            </Text>
          )}

          <HStack 
            spacing={{ base: 2, sm: 4 }} 
            mb={2} 
            width="100%" 
            justifyContent="center"
            px={2}
          >
            <Flex 
              align="center" 
              flex={{ base: 1, sm: "auto" }}
              maxW={{ base: "40%", sm: "none" }}
            >
              <Avatar 
                size={{ base: "xs", sm: "sm" }}
                src={match.team1?.logo} 
                name={match.team1?.name} 
                mr={1}
              />
              <Text 
                fontWeight="medium" 
                fontSize={{ base: "sm", sm: "md" }}
                noOfLines={1}
                isTruncated
              >
                {match.team1?.name}
              </Text>
            </Flex>
            <Text 
              fontWeight="bold" 
              fontSize={{ base: "sm", sm: "md" }}
              px={1}
            >
              vs
            </Text>
            <Flex 
              align="center" 
              flex={{ base: 1, sm: "auto" }}
              maxW={{ base: "40%", sm: "none" }}
            >
              <Avatar 
                size={{ base: "xs", sm: "sm" }}
                src={match.team2?.logo} 
                name={match.team2?.name} 
                mr={1}
              />
              <Text 
                fontWeight="medium" 
                fontSize={{ base: "sm", sm: "md" }}
                noOfLines={1}
                isTruncated
              >
                {match.team2?.name}
              </Text>
            </Flex>
          </HStack>

          {match.description && (
            <Text noOfLines={2} color="gray.600">
              {match.description}
            </Text>
          )}

          {match.category && (
            <Text fontSize="sm" color="gray.500" mt={2}>
              {match.category.name}
            </Text>
          )}
        </Box>
      </LinkBox>
    </>
  );
};

export default MatchCard; 